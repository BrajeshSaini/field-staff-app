import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
 
// Same shape as in hrm-action.component.ts — import that one instead of
// redeclaring it if you keep both files in the same project.
export interface LocationCoords {
  latitude: number;
  longitude: number;
}
 
export interface AttendanceStorageRecord {
  date: string;
  user_id: number;
  in_time: string;
  out_time?: string;
  in_location?: LocationCoords;
  out_location?: LocationCoords;
  in_selfie_image?: string | null;
  is_punched_out: boolean;
}
 
// The record shape once we've attached a ready-to-render selfie data URL
export interface AttendanceDisplayRecord extends AttendanceStorageRecord {
  selfie_data_Url: string | null;
}
 
@Component({
  selector: 'app-attendance-recodes',
  templateUrl: './attendance-recodes.component.html',
  styleUrls: ['./attendance-recodes.component.scss'],
  standalone: false
})
export class AttendanceRecodesComponent  implements OnChanges {
 
  // Raw records passed in from the parent (e.g. hrm-action component)
  @Input() attendance_records: AttendanceStorageRecord[] = [];
 
  // Records enriched with a selfie data URL, ready for the template
  display_records: AttendanceDisplayRecord[] = [];
 
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['attendance_records']) {
      this.build_display_records();
    }
  }
 
  private build_display_records(): void {
    const attendances = this.attendance_records ?? [];
 
    let with_attendance_list_with_selfie = attendances.map((record: any) => ({
      ...record,
      selfie_data_Url: record.in_selfie_image
        ? `data:image/jpeg;base64,${record.in_selfie_image}`
        : null
    }));
 
    this.display_records = with_attendance_list_with_selfie;
  }
}
