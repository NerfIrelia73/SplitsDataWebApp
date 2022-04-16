import { Component, ComponentFactoryResolver, OnInit } from '@angular/core';
import { DataMapService } from '../data-map.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { createAttemptHistory, createPBMap, getNoBestData } from './create-data-structs';
import { convertTimeToString, getDataIndex } from '../helper-functions';

@Component({
  selector: 'app-ls-upload',
  templateUrl: './ls-upload.component.html',
  styleUrls: ['./ls-upload.component.scss']
})

export class LsUploadComponent implements OnInit {
  file: File = '' as unknown as File; // Variable to store file
  currentFile: File = '' as unknown as File;
  finishedData: string | ArrayBuffer | null = '';

  //Holds segment history for each split and corresponding ids
  dataMap: {splitName: string, segmentTimes: {ID: string, time: string}[], subsplitSegmentTimes: {ID: string, time: string}[], numSubsplits: number}[] = [];
  compRunsIDs: string[] = [];
  xmlDoc: Document | null = null;
  timeComp = "RealTime";
  uploaded = false;
  noBestData: string[] = [];
  // Livesplit data vars
  lsDataIndex = {gameIcon: -1, gameName: -1, categoryName: -1, layoutPath: -1, metadata: -1, offset: -1, attemptCount: -1, attemptHistory: -1, segments: -1, autoSplitterSettings: -1}

  constructor(private dataMapService: DataMapService, private _sanitizer: DomSanitizer) { }

  ngOnInit(): void {
  }

  // On file Select
  onChange(event: Event) {
      if (event.target) {
        this.file = (event.target as unknown as { files: File[] }).files[0];
        const dispName = document.getElementById("file-selected");
        (dispName as HTMLElement).innerHTML = this.file.name.toString();
      }
  }

  // OnClick of button Upload
  onUpload(disp: boolean, whichFile: number) {
      let xmlData: string | ArrayBuffer | null = '';
      let tmpFile: File = '' as unknown as File;
      //console.log(this.file);
      //console.log(this.file.name.split(".").pop());
      const uploadMsg = document.getElementById("uploadStatus");
      if (uploadMsg != null) {
        if (this.file.name.split(".").pop() != "lss") {
          uploadMsg.innerHTML = "Please upload an lss file";
          uploadMsg.style.color = "red";
          if (disp) {
            uploadMsg.style.visibility = "visible";
          }
          setTimeout(function() {
            uploadMsg.style.visibility = "hidden";
          }, 4000);
        } else {
          if (whichFile == 0) {
            tmpFile = this.file;
          } else if (whichFile == 1) {
            tmpFile = this.currentFile;
          }
          const reader = new FileReader();
          reader.readAsText(tmpFile, "UTF-8");
          reader.onload = () => {
            xmlData = reader.result;
          };
          window.setTimeout(() => { //Wait before beginning to parse data
            this.finishedData = xmlData;
            this.dataMapService.setFinishedData(this.finishedData); //Set in service for other components to use
            this.timeComp = this.dataMapService.getTimeCompare();
            this.parsedFinishedData(this.finishedData as string, disp, whichFile);
          }, 500);
        }
      }
  }


  async parsedFinishedData(tmp: string, dispMessage: boolean, whichFile: number) {
    const parser = new DOMParser();
    this.dataMap = [];
    this.compRunsIDs = [];
    this.xmlDoc = parser.parseFromString(tmp,"text/xml"); //parse data from file
    //console.log(this.xmlDoc);
    const data = this.xmlDoc.documentElement.children;
    this.lsDataIndex = getDataIndex(Array.prototype.slice.call(data))
    //console.log(this.xmlDoc.documentElement);
    //console.log(data);
    const pbArr = [];
    const maxId = data[this.lsDataIndex.attemptHistory].childElementCount;
    let trueMinId = 1;
    const attempts = parseInt(data[this.lsDataIndex.attemptCount].innerHTML);
    if (maxId > attempts) {
      trueMinId = maxId - attempts;
    }
    //data[7].children = all of the segments
    const segmentIndex = data.item(0)
    let noData = true;
    for (let i = 0; i < data[this.lsDataIndex.segments].children.length; i++) {
      //console.log(data[this.lsDataIndex.segments].children[i].children)
      const tmpName = data[this.lsDataIndex.segments].children[i].children[0].innerHTML;
      let splitTime = "-";
      for (let j = 0; j < data[this.lsDataIndex.segments].children[i].children[2].children[0].children.length; j++) {
        if (data[this.lsDataIndex.segments].children[i].children[2].children[0].children[j] != null && data[this.lsDataIndex.segments].children[i].children[2].children[0].children[j].nodeName == this.timeComp) {
          splitTime = data[this.lsDataIndex.segments].children[i].children[2].children[0].children[j].innerHTML;
          noData = false;
        }
      }
      //console.log(splitTime);
      pbArr.push([tmpName, splitTime]);
      //console.log("Segment Name: " + tmpName);
      let j = 0;
      const tmpArr = [];
      //Go through all of the times in the segments of unknown length until we reach the end
      while (data[this.lsDataIndex.segments].children[i].children[4].children[j] != null) {
        //Get the time using either real time or game time depending on user's choice
        let nodeCheck = null;
        for (let k = 0; k < data[this.lsDataIndex.segments].children[i].children[4].children[j].children.length; k++) {
          if (data[this.lsDataIndex.segments].children[i].children[4].children[j].children[k] != null && data[this.lsDataIndex.segments].children[i].children[4].children[j].children[k].nodeName == this.timeComp) {
            nodeCheck = data[this.lsDataIndex.segments].children[i].children[4].children[j].children[k];
          }
        }
        const timeID = data[this.lsDataIndex.segments].children[i].children[4].children[j].id;
        if (nodeCheck != null && parseInt(timeID) >= trueMinId) {
          tmpArr.push({ID: timeID, time: nodeCheck.innerHTML});
          if (i == data[this.lsDataIndex.segments].children.length - 1 && parseInt(timeID)) {
            this.compRunsIDs.push(timeID);
          }
        }
        j++;
      }
      if (tmpName[0] == "-") {
        this.dataMap.push({splitName: tmpName, segmentTimes: tmpArr, subsplitSegmentTimes: [{ID: "-1", time: "-1"}], numSubsplits: 0});
      } else {
        this.dataMap.push({splitName: tmpName, segmentTimes: tmpArr, subsplitSegmentTimes: [], numSubsplits: 0});
      }
    }

    //Get subsplit times
    let subsplitTime = 0;
    let counter = 0;
    let subsplitCounter = 0;
    //let currentIndex = this.dataMap[this.dataMap.length - 1].segmentTimes[0].ID;
    while (counter <= maxId) {
      for (let i = 0; i < this.dataMap.length; i++) {
        const tmp = this.dataMap[i].segmentTimes.findIndex(k => k.ID == counter.toString());
        if (tmp != -1) {
          const convertArr = (this.dataMap[i].segmentTimes[tmp].time).split(":");
          const seconds = parseFloat(convertArr[0]) * 3600 + parseFloat(convertArr[1]) * 60 + parseFloat(convertArr[2]);
          subsplitTime += seconds;
          if (this.dataMap[i].splitName[0] == "-") {
            subsplitCounter++;
          } else if (this.dataMap[i].splitName[0] != "-") {
            if (this.dataMap[i].numSubsplits != subsplitCounter) {
              this.dataMap[i].subsplitSegmentTimes = []
            }
            this.dataMap[i].subsplitSegmentTimes.push({ID: counter.toString(), time: convertTimeToString(subsplitTime, false)});
            this.dataMap[i].numSubsplits = subsplitCounter;
            subsplitCounter = 0;
            subsplitTime = 0;
          }
        }
      }
      subsplitTime = 0;
      subsplitCounter = 0;
      counter++;
    }

    //console.log(this.dataMap);
    //data[6].children = all of the attempt history
    //console.log(data[this.lsDataIndex.attemptHistory].children)
    //console.log(this.attemptHist)
    const pbMap = await createPBMap(pbArr, data, this.lsDataIndex, this.timeComp, this._sanitizer)
    const attemptHist = await createAttemptHistory(trueMinId, data, this.lsDataIndex)
    this.noBestData = getNoBestData()
    //console.log(pbArr)
    //console.log(this.pbMap);
    //console.log(this.dataMap);
    //console.log(this.attemptHist);
    //console.log(this.compRunsIDs);
    const uploadMsg = document.getElementById("uploadStatus");
    if (!noData && this.noBestData.length == 0) {
      const dispName = document.getElementById("file-selected");
      if (dispName != null && whichFile == 0) {
        this.currentFile = this.file;
      }
      if (dispMessage && uploadMsg != null) {
        uploadMsg.innerHTML = "Upload Successful!";
        uploadMsg.style.color = "green";
        this.uploaded = true;
        uploadMsg.style.visibility = "visible";
        setTimeout(function() {
          uploadMsg.style.visibility = "hidden";
        }, 4000);
      }
      //console.log(this.dataMap)
      this.dataMapService.setPBMap(pbMap);
      this.dataMapService.setCompRunsIDs(this.compRunsIDs);
      this.dataMapService.setAttemptHist(attemptHist);
      this.dataMapService.setDataMap(this.dataMap); //Set in service for other components to use
      this.dataMapService.setDataIndex(this.lsDataIndex)
      this.dataMapService.nowDisp(true);
    } else if (noData) {
      if (uploadMsg != null) {
        uploadMsg.innerHTML = "Error: The file may not have enough data to analyze or does not use the currently selected Timing Comparison.  Please select a different Timing Comparison or a different file.";
        uploadMsg.style.color = "red";
        uploadMsg.style.visibility = "visible";
        setTimeout(function() {
          uploadMsg.style.visibility = "hidden";
        }, 8000);
      }
    } else if (this.noBestData.length > 0) {
      //console.log(this.noBestData);
      const output = document.getElementById("errBox");
      if (output) output.style.visibility = "visible";
    }
  }

  //Changes which time comparison the user wants to use
  changeTimeComp(text: string) {
    //console.log(num);
    const rtButton = document.getElementById("realTime");
    const gtButton = document.getElementById("gameTime");
    if (rtButton != null && gtButton != null) {
      if (text == "RealTime") {
        rtButton.style.background = "#212325";
        gtButton.style.background = "#2f3136";
      } else if (text == "GameTime") {
        rtButton.style.background = "#2f3136";
        gtButton.style.background = "#212325";
      }
      this.dataMapService.setTimeCompare(text);
      if (this.uploaded) {
        if (this.file != this.currentFile) {
          this.onUpload(false, 1);
        } else {
          this.onUpload(false, 0);
        }
      }
    }
  }

  closeDiv(name: string) {
    //console.log("This is help");
    const output = document.getElementById(name);
    if (output) output.style.visibility = "hidden";
  }
}
