import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { convertTimeToString, createImage } from "../helper-functions";


let noBestData: string[] = []

export const getNoBestData = function() {
    return noBestData
}

export const createPBMap = async function(pbArr: string[][], data: HTMLCollection, lsDataIndex: any, timeComp: string, _sanatizer: DomSanitizer) {
    const pbMap: {splitNum: number, splitName: string, splitIcon: SafeResourceUrl, splitTime: string, subsplitTime: string, runTime: string}[] = [];
    noBestData = []
    for (let i = 0; i < pbArr.length; i++) {
        const segData = data[lsDataIndex.segments].children[i]
        const tmpIcon = createImage(segData.children[1].innerHTML, _sanatizer);
        let hasData = false;
        for (let j = 0; j < segData.children[3].children.length; j++) {
          if (segData.children[3].children[j] != null && segData.children[3].children[j].nodeName == timeComp) {
            hasData = true
          }
        }
        if (!hasData) {
          noBestData.push(segData.children[0].innerHTML);
        }
        let properIndex = i - 1; //Looking for splits with no split time in pb
        let prevMainSplit = i - 1; //Looking for prev main split for subsplits
        while (properIndex >= 0 && pbArr[properIndex][1] == "-") {
          properIndex--;
        }
        while (prevMainSplit >= 0 && pbArr[prevMainSplit][0][0] == "-" || prevMainSplit > properIndex) {
          prevMainSplit--;
        }
        if (pbArr[i][1] == "-") {
          pbMap.push({splitNum: i + 1, splitName: pbArr[i][0], splitIcon: tmpIcon, splitTime: "-", subsplitTime: "-", runTime: "-"});
        } else {
          if (i > 0) {
            if (properIndex < 0) {
              pbMap.push({splitNum: i + 1, splitName: pbArr[i][0], splitIcon: tmpIcon, splitTime: pbArr[i][1].substring(0, pbArr[i][1].length - 4), subsplitTime: pbArr[i][1].substring(0, pbArr[i][1].length - 4), runTime: pbArr[i][1].substring(0, pbArr[i][1].length - 4)});
            } else {
              const currSplitTime = pbArr[i][1].split(":");
              const prevSplitTime = pbArr[properIndex][1].split(":");
              const secDiff = parseFloat(((parseInt(currSplitTime[0]) * 3600 + parseInt(currSplitTime[1]) * 60 + parseFloat(currSplitTime[2])) - (parseInt(prevSplitTime[0]) * 3600 + parseInt(prevSplitTime[1]) * 60 + parseFloat(prevSplitTime[2]))).toFixed(2));
              const timeDiff = convertTimeToString(secDiff, false);
              if (prevMainSplit >= 0) {
                const prevMainSplitTime = pbArr[prevMainSplit][1].split(":");
                const mainSecDiff = parseFloat(((parseInt(currSplitTime[0]) * 3600 + parseInt(currSplitTime[1]) * 60 + parseFloat(currSplitTime[2])) - (parseInt(prevMainSplitTime[0]) * 3600 + parseInt(prevMainSplitTime[1]) * 60 + parseFloat(prevMainSplitTime[2]))).toFixed(2));
                const mainTimeDiff = convertTimeToString(mainSecDiff, false);
                pbMap.push({splitNum: i + 1, splitName: pbArr[i][0], splitIcon: tmpIcon, splitTime: timeDiff, subsplitTime: mainTimeDiff, runTime: pbArr[i][1].substring(0, pbArr[i][1].length - 4)});
              } else {
                pbMap.push({splitNum: i + 1, splitName: pbArr[i][0], splitIcon: tmpIcon, splitTime: timeDiff, subsplitTime: pbArr[i][1].substring(0, pbArr[i][1].length - 4), runTime: pbArr[i][1].substring(0, pbArr[i][1].length - 4)});
              }
            }
          } else {
            pbMap.push({splitNum: i + 1, splitName: pbArr[i][0], splitIcon: tmpIcon, splitTime: pbArr[i][1].substring(0, pbArr[i][1].length - 4), subsplitTime: pbArr[i][1].substring(0, pbArr[i][1].length - 4), runTime: pbArr[i][1].substring(0, pbArr[i][1].length - 4)});
          }
        }
      }
    return pbMap
}

export const createAttemptHistory = async function(trueMinId: number, data: HTMLCollection, lsDataIndex: any) {
    const attemptHist: {ID: string, time: number}[] = [];
    for (let i = trueMinId - 1; i < data[lsDataIndex.attemptHistory].children.length; i++) {
        //console.log(i)
        const id = data[lsDataIndex.attemptHistory].children[i].id;
        //console.log(id)
        let startTime = null
        let endTime = null
        if (data[lsDataIndex.attemptHistory].children[i].attributes[1] && data[lsDataIndex.attemptHistory].children[i].attributes[3]) {
          startTime = data[lsDataIndex.attemptHistory].children[i].attributes[1].textContent?.split(" ");
          endTime = data[lsDataIndex.attemptHistory].children[i].attributes[3].textContent?.split(" ");
        }
        //console.log(startTime);
        //console.log(endTime);
        if (startTime != null && endTime != null) {
          const tmpStart = [];
          const tmpEnd = [];
          tmpStart.push(startTime[0].split("/"));
          tmpStart.push(startTime[1].split(":"));
          tmpEnd.push(endTime[0].split("/"));
          tmpEnd.push(endTime[1].split(":"));
          const a = Date.UTC(parseInt(tmpStart[0][2]), parseInt(tmpStart[0][0]) - 1, parseInt(tmpStart[0][1]), parseInt(tmpStart[1][0]) - 1, parseInt(tmpStart[1][1]), parseFloat(tmpStart[1][2]));
          const b = Date.UTC(parseInt(tmpEnd[0][2]), parseInt(tmpEnd[0][0]) - 1, parseInt(tmpEnd[0][1]), parseInt(tmpEnd[1][0]) - 1, parseInt(tmpEnd[1][1]), parseFloat(tmpEnd[1][2]));
          const totalSec = Math.floor((b - a) / 1000);
          //console.log("ID: " + id);
          //console.log("Total Sec: " + totalSec + "\n");
          attemptHist.push({ID: id, time: totalSec});
        } else {
          //This means that livesplit fucked up big time and if there isn't an attempt there, then
          //nothing works so we are just gonna push 0
          attemptHist.push({ID: id, time: 0})
        }
      }
    return attemptHist
}