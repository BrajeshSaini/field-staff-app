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

  async captureSelfie_() {
    this.isCapturing = true;
    try {
      // const result = await Camera.takePhoto({
      //   quality: 80,
      //   editable: 'no',
      //   cameraDirection: CameraDirection.Front,
      //   includeMetadata: true
      // });

      const result = await Camera.takePhoto({
        quality: 80,
        editable: 'no',
        cameraDirection: CameraDirection.Front,
        includeMetadata: true
        // no webUseInput here
      });


      const format = result.metadata?.format ?? 'jpeg';
      const dataUrl = `data:image/${format};base64,${result.thumbnail}`;
      this.selfieImage = dataUrl;

      const file = await this.dataUrlToFile(dataUrl, `selfie_${Date.now()}.jpg`);
      this.selfieCaptured.emit({ dataUrl, file });

    } catch (err: any) {
      console.error('Selfie capture failed/cancelled', err);
      const message = err?.code ? `[${err.code}] ${err.message}` : (err?.message || 'Could not capture selfie.');
      this.selfieError.emit(message);
    } finally {
      this.isCapturing = false;
    }
  }


  async captureSelfie__() {
  this.isCapturing = true;
  try {
    const result = await Camera.takePhoto({
      quality: 80,
      editable: 'no',
      cameraDirection: CameraDirection.Front,
      includeMetadata: true
    });

    console.log('Camera result:', result); // temporary — check webPath/thumbnail in devtools

    // webPath is reliable for binding directly to <img src> on both web and native
    this.selfieImage = result.webPath ?? null;

    if (!this.selfieImage) {
      throw new Error('No image path returned from camera.');
    }

    const file = await this.webPathToFile(this.selfieImage, `selfie_${Date.now()}.jpg`);
    console.log('About to emit selfieCaptured:', { dataUrl: this.selfieImage, file }); // ADD THIS
    this.selfieCaptured.emit({ dataUrl: this.selfieImage, file });
    console.log('Emit called successfully'); // ADD THIS
    // this.selfieCaptured.emit({ dataUrl: this.selfieImage, file });

  } catch (err: any) {
    console.error('Selfie capture failed/cancelled', err);
    const message = err?.code ? `[${err.code}] ${err.message}` : (err?.message || 'Could not capture selfie.');
    this.selfieError.emit(message);
  } finally {
    this.isCapturing = false;
  }
}

private async webPathToFile__(webPath: string, filename: string): Promise<File> {
  const res = await fetch(webPath); // works for blob: URLs and data: URLs alike
  const blob = await res.blob();
  return new File([blob], filename, { type: blob.type || 'image/jpeg' });
}


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

    // for reudce file size
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

    this.selfieImage = result.webPath ?? null;
    console.log('STEP 3: selfieImage set to', this.selfieImage);

    if (!this.selfieImage) {
      throw new Error('No image path returned from camera.');
    }

    console.log('STEP 4: starting fetch of webPath');
    const file = await this.webPathToFile(this.selfieImage, `selfie_${Date.now()}.jpg`);
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

private async webPathToFile(webPath: string, filename: string): Promise<File> {
  console.log('webPathToFile: fetching', webPath);
  const res = await fetch(webPath);
  console.log('webPathToFile: fetch response', res);
  const blob = await res.blob();
  console.log('webPathToFile: blob', blob);
  return new File([blob], filename, { type: blob.type || 'image/jpeg' });
}

  retakeSelfie() {
    this.selfieImage = null;
    this.captureSelfie();
  }

  removeSelfie() {
    this.selfieImage = null;
    this.selfieRemoved.emit();
  }

  private async dataUrlToFile(dataUrl: string, filename: string): Promise<File> {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    return new File([blob], filename, { type: blob.type || 'image/jpeg' });
  }
}
