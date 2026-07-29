import { Component, OnInit, OnDestroy } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { interval, Subscription, switchMap } from 'rxjs';

import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { SelfieResult } from '../selfie/selfie.component';

export interface LoggedUserDetails {
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  role_name: string;
  token: string;
  user_id: string;
  branch_id: string | number;
  employer_user_id: string | number;
}

// Only lat/lng is tracked for location
export interface LocationCoords {
  latitude: number;
  longitude: number;
}

// One punch in/out record
export interface AttendanceStorageRecord {
  date: string;                 // "YYYY-MM-DD"
  user_id: number;
  in_time: string;               // "HH:mm" (24hr, used for calculations)
  out_time?: string;              // "HH:mm"
  in_location?: LocationCoords;
  out_location?: LocationCoords;
  in_selfie_image?: string | null;
  is_punched_out: boolean;
}

// Create prefix for sepacific user by user id
const ATTENDANCE_STORAGE_PREFIX = 'attendance_records_'; // + user_id -> holds an ARRAY of records

@Component({
  selector: 'app-hrm-action',
  templateUrl: './hrm-action.component.html',
  styleUrls: ['./hrm-action.component.scss'],
  standalone: false
})
export class HrmActionComponent implements OnInit, OnDestroy {

  // String
  toastMessage: string = '';
  office_in_time: string = '';
  total_office_in_time: string = '';
  punch_in_or_out_address: string = 'Bhopal, M.P., India';
  store_office_in_time: string = "";
  selfieImage: string = '';


  // Boolean
  is_skeleton_on = false;
  is_map_show = false;
  is_show_mark_attendance_btn = true;
  is_enable_location: boolean = false;

  // Object — just { latitude, longitude, is_location }
  logged_user_details!: LoggedUserDetails | any;
  user_full_location_obj: { latitude?: number; longitude?: number; is_location?: boolean } = {};

  // All attendance records for this user, read from localStorage — for display in the table
  attendance_records: AttendanceStorageRecord[] = [];


  // Subscription 
  check_user_location_subscription: Subscription = new Subscription();

  is_location_enable_subscription: Subscription = new Subscription();
  check_user_logged_or_not_subsription: Subscription = new Subscription();
  get_check_is_user_leave_today_or_not_subscription: Subscription = new Subscription();
  set_mark_attendance_subscription: Subscription = new Subscription();
  set_time_out_subscription: Subscription = new Subscription();


  check_is_user_leave_today_or_not_subscription: Subscription = new Subscription();
  mark_attendance_subscription: Subscription = new Subscription();
  punch_out_subscription: Subscription = new Subscription();

  // Live "working time" ticker
  private working_time_ticker: Subscription = new Subscription();

  cachedPosition: GeolocationCoordinates | null = null;

  constructor(private modalCtrl: ModalController,
    private toastController: ToastController, private router: Router,
  ) { }

  ngOnInit() {
    this.logged_user_details = JSON.parse(localStorage.getItem('logged_user_details')!);

    // Restore today's attendance state (if any) from localStorage
    this.load_attendance_from_storage();

    // Load the full records list for display in the table
    this.refresh_attendance_records_view();

    this.check_user_location();
  }

  /** Re-reads all stored records into attendance_records, for the table in the template */
  private refresh_attendance_records_view(): void {
    this.attendance_records = this.read_all_attendance_records();
  }

  /* ---------------------------- LocalStorage helpers (array-based) ---------------------------- */

  /** Returns today's date as "YYYY-MM-DD" */
  private get_today_date_key(): string {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = (now.getMonth() + 1).toString().padStart(2, '0');
    const dd = now.getDate().toString().padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  // Step 1 
  /*
    * localStorage key holding the full array of attendance records for this user 
    * reture like this "attendance_records_unknown" if no user id found if found this show like this "attendance_records_9" 
  */
  private get_storage_key(): string {
    const user_id = this.logged_user_details?.user_id ?? 'unknown';
    return `${ATTENDANCE_STORAGE_PREFIX}${user_id}`;
  }

  // Step 2
  /** Reads the full array of attendance records for this user (empty array if none yet) */
  private read_all_attendance_records(): AttendanceStorageRecord[] {
    const raw = localStorage.getItem(this.get_storage_key());
    if (!raw) {
      return [];
    }
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];             /*
                                                                  Array.isArray() is a built-in JavaScript function 
                                                                  whose only job is to answer one question: 
                                                                  "Is this value an array?" — returning true or false.

                                                                  Array.isArray([1, 2, 3])        // true
                                                                  Array.isArray(['a', 'b'])       // true
                                                                  Array.isArray([])               // true  (empty array is still an array)

                                                                  Array.isArray({ name: 'John' }) // false (it's an object, not an array)
                                                                  Array.isArray('hello')          // false (it's a string)
                                                                  Array.isArray(123)              // false (it's a number)
                                                                  Array.isArray(null)             // false
                                                                  Array.isArray(undefined)        // false

                                                                  Why not just use typeof?

                                                                  This is the key reason Array.isArray() exists. You'd think typeof could check this, but it can't — here's the problem:

                                                                  typeof []              // "object"  😕
                                                                  typeof [1, 2, 3]        // "object"  😕
                                                                  typeof { foo: 'bar' }   // "object"  😕
                                                              */
    } catch (e) {
      console.error('Failed to parse attendance records from localStorage', e);
      return [];
    }
  }

  // Step 3 
  /** Writes the full array of attendance records back to localStorage */
  private write_all_attendance_records(records: AttendanceStorageRecord[]): void {
    localStorage.setItem(this.get_storage_key(), JSON.stringify(records));
  }

  /** Appends a new record to the array */
  private add_attendance_record(record: AttendanceStorageRecord): void {
    const records = this.read_all_attendance_records();
    records.push(record);
    this.write_all_attendance_records(records);
  }

  /** Finds today's record that has been punched in but not yet punched out */
  private find_open_record_for_today(): { record: AttendanceStorageRecord; index: number } | null {
    const records = this.read_all_attendance_records();
    const today = this.get_today_date_key();
    for (let i = records.length - 1; i >= 0; i--) {
      if (records[i].date === today && !records[i].is_punched_out) {
        return { record: records[i], index: i };
      }
    }
    return null;
  }

  /** Finds today's most recent record overall (punched out or not), for restoring UI state */
  private find_latest_record_for_today(): AttendanceStorageRecord | null {
    const records = this.read_all_attendance_records();
    const today = this.get_today_date_key();
    const todays_records = records.filter(r => r.date === today);
    return todays_records.length ? todays_records[todays_records.length - 1] : null;
  }

  /** Updates the record at a given index and saves the whole array */
  private update_attendance_record_at(index: number, updated: AttendanceStorageRecord): void {
    const records = this.read_all_attendance_records();
    records[index] = updated;
    this.write_all_attendance_records(records);
  }

  /** Called on init: if today already has a punch-in, restore the UI state from it */
  private load_attendance_from_storage(): void {
    const record = this.find_latest_record_for_today();

    if (!record) {
      // No punch-in yet today
      this.is_show_mark_attendance_btn = true;
      this.is_skeleton_on = true;
      return;
    }

    this.store_office_in_time = record.in_time;
    this.office_in_time = this.convertTo12Hour(record.in_time);

    if (record.is_punched_out && record.out_time) {
      // Already punched out: show final total, allow punching in again
      const total_time = this.calculate_office_time_between(record.in_time, record.out_time);
      this.total_office_in_time = this.format_hours_minutes(total_time.hours, total_time.minutes);
      this.is_show_mark_attendance_btn = true;
      this.is_skeleton_on = true;
    } else {
      // Punched in, not yet punched out: show live "Punch Out" state
      this.is_show_mark_attendance_btn = false;
      this.is_skeleton_on = true;
      this.start_working_time_ticker(record.in_time);
    }
  }

  /** Keeps "Working time" ticking every minute while the user is punched in */
  private start_working_time_ticker(in_time: string): void {
    this.working_time_ticker.unsubscribe();
    this.working_time_ticker = interval(60000).subscribe(() => {
      const total_time = this.calculate_office_time(in_time);
      this.total_office_in_time = this.format_hours_minutes(total_time.hours, total_time.minutes);
    });
    // Set immediately too, don't wait a full minute for the first tick
    const total_time = this.calculate_office_time(in_time);
    this.total_office_in_time = this.format_hours_minutes(total_time.hours, total_time.minutes);
  }

  private format_hours_minutes(hours: number, minutes: number): string {
    const h = hours.toString().padStart(2, '0');
    const m = minutes.toString().padStart(2, '0');
    return `${h}:${m}`;
  }

  /* ---------------------------- End LocalStorage helpers ---------------------------- */

  convertTo12Hour(in_time: string): string {
    const [hour, minutes] = in_time.split(':').map(Number);
    const period = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
  }

  calculate_office_time(in_time: string): { hours: number; minutes: number } {
    const [inHours, inMinutes] = in_time.split(':').map(Number);
    const now = new Date();
    const diffMinutes = now.getHours() * 60 + now.getMinutes() - (inHours * 60 + inMinutes);
    return { hours: Math.floor(diffMinutes / 60), minutes: diffMinutes % 60 };
  }

  /** Same as calculate_office_time but between two fixed times (used once punched out) */
  calculate_office_time_between(in_time: string, out_time: string): { hours: number; minutes: number } {
    const [inHours, inMinutes] = in_time.split(':').map(Number);
    const [outHours, outMinutes] = out_time.split(':').map(Number);
    const diffMinutes = (outHours * 60 + outMinutes) - (inHours * 60 + inMinutes);
    return { hours: Math.floor(diffMinutes / 60), minutes: diffMinutes % 60 };
  }

  async check_user_location() {
    if (this.cachedPosition) {
      this.sendLocation(this.cachedPosition.latitude, this.cachedPosition.longitude);
      return;
    }

    navigator.geolocation.getCurrentPosition((pos) => {
      this.cachedPosition = pos.coords; // store for reuse
      this.sendLocation(pos.coords.latitude, pos.coords.longitude);
    });
  }

  async check_user_location_2() {
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude, accuracy } = pos.coords;

      console.log("Lat:", latitude, "Lng:", longitude, "Accuracy:", accuracy);

      // Accuracy check
      if (accuracy > 50) {
        this.toastMessage = "Low GPS accuracy. Try again.";
        return;
      }

      // Good reading → send to backend
      this.sendLocation(latitude, longitude);
    });
  }

  /** Stores just latitude/longitude on the component */
  sendLocation(lat: number, lng: number) {
    this.user_full_location_obj = {
      latitude: lat,
      longitude: lng,
      is_location: true
    };
  }

  async load_map() {
    this.check_user_location();
    this.is_map_show = true;
    this.punch_in();
  }

  async punch_in() {

    const now = new Date();
    const in_time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const in_location: LocationCoords = {
      latitude: this.user_full_location_obj.latitude as number,
      longitude: this.user_full_location_obj.longitude as number
    };

    let mark_attendance_obj: any = new Object();
    mark_attendance_obj.attendance_by = 'hybrid_app';           // For Present
    mark_attendance_obj.addendance_code_id = 2;           // For Present
    mark_attendance_obj.user_id =2;   // default
    mark_attendance_obj.in_latitude = in_location.latitude;
    mark_attendance_obj.in_longitude = in_location.longitude;
    mark_attendance_obj.in_selfie_image = this.selfieBase64;

    console.log(mark_attendance_obj);

    // --- Push a new record onto the array in localStorage ---
    const record: AttendanceStorageRecord = {
      date: this.get_today_date_key(),
      user_id: 2,   // default,
      in_time: in_time,
      in_location: in_location,
      in_selfie_image: this.selfieBase64,
      is_punched_out: false,
    };
    this.add_attendance_record(record);

    // --- Update UI state ---
    this.store_office_in_time = in_time;
    this.office_in_time = this.convertTo12Hour(in_time);
    this.is_show_mark_attendance_btn = false;
    this.is_skeleton_on = true;
    this.start_working_time_ticker(in_time);
    this.refresh_attendance_records_view();
  }

  async punch_out() {
    // this.is_skeleton_on = false;

    const now = new Date();
    const out_time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const out_location: LocationCoords = {
      latitude: this.user_full_location_obj.latitude as number,
      longitude: this.user_full_location_obj.longitude as number
    };

    let time_out_attendance_obj: any = new Object();
    time_out_attendance_obj.addendance_code_id = 2;
    time_out_attendance_obj.user_id =2;   // default
    time_out_attendance_obj.out_latitude = out_location.latitude;
    time_out_attendance_obj.out_longitude = out_location.longitude;

    console.log(time_out_attendance_obj);

    // --- Find today's open (not-yet-punched-out) record in the array and update just that one ---
    const open = this.find_open_record_for_today();
    const in_time = open?.record.in_time ?? this.store_office_in_time;

    if (open) {
      const updated_record: AttendanceStorageRecord = {
        ...open.record,
        out_time: out_time,
        out_location: out_location,
        is_punched_out: true,
      };
      this.update_attendance_record_at(open.index, updated_record);
    }

    // --- Update UI state ---
    this.working_time_ticker.unsubscribe();
    const total_time = this.calculate_office_time_between(in_time, out_time);
    this.total_office_in_time = this.format_hours_minutes(total_time.hours, total_time.minutes);
    this.is_show_mark_attendance_btn = true;
    this.refresh_attendance_records_view();
  }

  handleGoAttendanceRouteInWel() {
    this.router.navigateByUrl('/welcome/attendances');
  }


  get_location(location_full_obj: any) {
    // Kept for compatibility if some other component still emits a full address obj —
    // only lat/lng is used/stored going forward.
    this.user_full_location_obj = {
      latitude: location_full_obj?.latitude,
      longitude: location_full_obj?.longitude,
      is_location: true
    };
  }



  async presentToast() {
    if (this.toastMessage) {
      const toast = await this.toastController.create({ message: this.toastMessage, duration: 2000 });
      toast.present();
      this.toastMessage = '';
    }
  }


  reset_time() {
    this.office_in_time = "0:00";
    this.total_office_in_time = "0:00";
    this.is_skeleton_on = true;
  }

  ionViewDidLeave() {
    // Boolean
    this.is_enable_location = false;

    // Subscription 
    this.is_location_enable_subscription.unsubscribe();
  }


  close() {
    this.modalCtrl.dismiss();
  }

  confirm(msg: any) {
    this.modalCtrl.dismiss(msg);
  }
  /* ---------------------------- For Selfie ---------------------------- */
  selfieFile: File | null = null;
  selfieDataUrl: string | null = null;
  selfieBase64: string | null = null; // ready to send to backend

  async onSelfieCaptured(result: SelfieResult) {
    console.log('Parent received:', result);
    this.selfieDataUrl = result.dataUrl;
    this.selfieFile = result.file;

    // Convert File -> base64 string for DB storage
    this.selfieBase64 = await this.fileToBase64(result.file);
    console.log('Base64 length:', this.selfieBase64?.length);
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64Only = result.split(',')[1];
        resolve(base64Only);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
  /* ---------------------------- End For Selfie ---------------------------- */

  ngOnDestroy(): void {
    // Boolean
    this.is_enable_location = false;
    this.is_map_show = false;

    // Subscription 
    this.is_location_enable_subscription.unsubscribe();
    this.working_time_ticker.unsubscribe();
  }
  
  logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('role');
    localStorage.removeItem('logged_user_details');
    this.router.navigateByUrl('/login');
  }
}