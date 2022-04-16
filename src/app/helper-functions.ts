import { DomSanitizer } from "@angular/platform-browser";

  //Converts seconds into the string that will be displayed to the user (HH:MM:SS.MS)
  export const convertTimeToString = function(time: number, needD: boolean) {
    let retStr = "";
    let totalSeconds = time;
    if (needD) {
      const days = Math.floor(totalSeconds / 86400);
      if (days < 10) {
        retStr += "0";
      }
      retStr += days + ":";
      totalSeconds %= 86400;
    }
    const hours = Math.floor(totalSeconds / 3600);
    if (hours < 10) {
      retStr += "0";
    }
    retStr += hours + ":";
    totalSeconds %= 3600;
    const minutes = Math.floor(totalSeconds / 60);
    if (minutes < 10) {
      retStr += "0";
    }
    retStr += minutes + ":";
    const tmpSeconds = totalSeconds % 60;
    if (tmpSeconds < 10) {
      retStr += "0";
    }
    retStr += (Math.round(tmpSeconds * 1000) / 1000).toFixed(3);
    return retStr;
  }

  export const getDataIndex = function(arr: any) {
    return {
      gameIcon: arr.findIndex((k: { tagName: string; }) => k.tagName == "GameIcon"),
      gameName: arr.findIndex((k: { tagName: string; }) => k.tagName == "GameName"),
      categoryName: arr.findIndex((k: { tagName: string; }) => k.tagName == "CategoryName"),
      layoutPath: arr.findIndex((k: { tagName: string; }) => k.tagName == "LayoutPath"),
      metadata: arr.findIndex((k: { tagName: string; }) => k.tagName == "Metadata"),
      offset: arr.findIndex((k: { tagName: string; }) => k.tagName == "Offset"),
      attemptCount: arr.findIndex((k: { tagName: string; }) => k.tagName == "AttemptCount"),
      attemptHistory: arr.findIndex((k: { tagName: string; }) => k.tagName == "AttemptHistory"),
      segments: arr.findIndex((k: { tagName: string; }) => k.tagName == "Segments"),
      autoSplitterSettings: arr.findIndex((k: { tagName: string; }) => k.tagName == "AutoSplitterSettings")
    }
    //console.log(this.lsDataIndex)
  }

  export const createImage = function(data: string, _sanitizer: DomSanitizer) {
    if (data.length == 0) {
      return "";
    }
    let tmp = data;
    tmp = tmp.substring(217, tmp.length - 3);  //217 appears to be the end of the header Livesplit puts on the string
    const binary_string = window.atob(tmp);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    const byteArr = Array.from(bytes);

    //Shift the bytes twice because Livesplit's encoding is the worst thing ever
    byteArr.shift();
    byteArr.shift();
    let newByteArr = new Uint8Array(byteArr);
    //console.log(newByteArr);
    //console.log(newByteArr.length);
    while (newByteArr.length % 3 != 0) {
      newByteArr = newByteArr.slice(0, newByteArr.length - 1);
    }
    let final = btoa(String.fromCharCode(...newByteArr));
    final = final.substring(4, final.length - 1);  //There is extra padding at the beginning of the string that needs to be chopped off
    const imagePath = _sanitizer.bypassSecurityTrustResourceUrl('data:image/jpg;base64,'
                 + final);
    return imagePath;
  }

  export const determineValidInput = function(calcMethod: any, attemptHist: any, compRunsIDs: any) {
    const numInput = document.getElementById('numRuns');
    const errMsg = document.getElementById('argErrMsg');
    let validInput = true;
    let numRuns = 0;
    if (numInput) {
      const tmpInput = (numInput as HTMLInputElement).value;
      numRuns = parseInt((numInput as HTMLInputElement).value);
      if (
        calcMethod != 2 &&
        calcMethod != 5 &&
        (!/^\d+$/.test(tmpInput) ||
          numRuns <= 0 ||
          (calcMethod < 2 && numRuns > attemptHist.length) ||
          (calcMethod > 2 && numRuns > compRunsIDs.length))
      ) {
        //Do something
        if (errMsg) {
          errMsg.style.visibility = 'visible';
          setTimeout(function() {
            errMsg.style.visibility = 'hidden';
          }, 4000);
        }
        validInput = false;
      }
    }
    return validInput
  }