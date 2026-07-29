import { Component, EventEmitter, Output } from '@angular/core';
import { Camera, CameraDirection } from '@capacitor/camera';

export interface SelfieResult {
  dataUrl: string;
  file: File;
}



@Component({
  selector: 'app-selfie',
  templateUrl: './selfie.component.html',
  styleUrls: ['./selfie.component.scss'],
  standalone: false
})
export class SelfieComponent {

  @Output() selfieCaptured = new EventEmitter<SelfieResult>();
  @Output() selfieRemoved = new EventEmitter<void>();
  @Output() selfieError = new EventEmitter<string>();

  selfieImage: string | null = null;
  isCapturing = false;


  async captureSelfie() {
    this.isCapturing = true;
    try {
      console.log('STEP 1: calling takePhoto');
      /*
      const result = await Camera.takePhoto({
        quality: 80,
        editable: 'no',
        cameraDirection: CameraDirection.Front,
        includeMetadata: true
      });
      */

      // for reduce file size
      const result = await Camera.takePhoto({
        // quality: 50,              // was 80 — lower = smaller file, still fine for a face photo
        quality: 40,              // was 80 — lower = smaller file, still fine for a face photo
        editable: 'no',
        cameraDirection: CameraDirection.Front,
        // targetWidth: 480,         // resize down — must be used together with targetHeight
        // targetHeight: 480,

        targetWidth: 240,         // resize down — must be used together with targetHeight
        targetHeight: 240,
        includeMetadata: true
      });


      console.log('STEP 2: got result', result);

      this.selfieImage = result.webPath ?? null;        // result.webPath ia browser-renderable URL who point of taken photo (result.webPath एक browser-renderable URL है जो ली गई photo की तरफ इशारा करता है ()
      console.log('STEP 3: selfieImage set to', this.selfieImage);

      if (!this.selfieImage) {
        throw new Error('No image path returned from camera.');
      }

      console.log('STEP 4: starting fetch of webPath');
      const file = await this.webPathToFile(this.selfieImage, `selfie_${Date.now()}.jpg`);    /* उस web path को असली File object में बदलता है (अगर आप image को FormData के ज़रिए upload करना चाहें, तो यह ज़रूरी है)। Filename unique रखने के लिए current timestamp का इस्तेमाल किया गया है। */
      console.log('STEP 5: file built', file);

      console.log('STEP 6: emitting selfieCaptured');
      this.selfieCaptured.emit({ dataUrl: this.selfieImage, file });
      console.log('STEP 7: emit done');

    } catch (err: any) {
      console.error('CAUGHT ERROR AT SOME STEP:', err);
      const message = err?.code ? `[${err.code}] ${err.message}` : (err?.message || 'Could not capture selfie.');
      this.selfieError.emit(message);
    } finally {
      this.isCapturing = false;
    }
  }

  // convert webPath to file  : WebPath have blob-URL like string who get from  Capacitor
  private async webPathToFile(webPath: string, filename: string): Promise<File> {
    console.log('webPathToFile: fetching', webPath);
    const res = await fetch(webPath);
    console.log('webPathToFile: fetch response', res);
    const blob = await res.blob();
    console.log('webPathToFile: blob', blob);
    return new File([blob], filename, { type: blob.type || 'image/jpeg' });
  }

  /* 
    एक private utility जो webPath (जो Capacitor से मिलने वाली blob-URL जैसी string होती है) को एक असली File में बदलती है:

    fetch() से webPath को fetch करता है — यह इसलिए काम करता है क्योंकि Capacitor का webPath असल में एक local blob URL से backed होता है जिसे browser retrieve कर सकता है।
    Response को Blob में बदलता है।
    उस blob को दिए गए filename और MIME type (अगर blob में type न हो तो default image/jpeg) के साथ एक File object में wrap कर देता है।
  */

  retakeSelfie() {
    this.selfieImage = null;
    this.captureSelfie();
  }

  removeSelfie() {
    this.selfieImage = null;
    this.selfieRemoved.emit();
  }

}
