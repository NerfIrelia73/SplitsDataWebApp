import { Component, OnInit } from '@angular/core';
import { DataMapService } from '../data-map.service';
import { filter, take } from 'rxjs/operators';
import {
  MonacoEditorConstructionOptions,
  MonacoEditorLoaderService
} from '@materia-ui/ngx-monaco-editor';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-ls-true-balanced',
  templateUrl: './ls-true-balanced.component.html',
  styleUrls: ['./ls-true-balanced.component.scss']
})
export class LsTrueBalancedComponent implements OnInit {
  constructor(
    private dataMapService: DataMapService,
    private monacoLoaderService: MonacoEditorLoaderService
  ) {
    this.monacoLoaderService.isMonacoLoaded$
      .pipe(
        filter(isLoaded => !!isLoaded),
        take(1)
      )
      .subscribe(() => {
        monaco.editor.defineTheme('myCustomTheme', {
          base: 'vs-dark', // can also be vs or hc-black
          inherit: true, // can also be false to completely replace the builtin rules
          rules: [],
          colors: {
            'editor.background': '#27282c' // code background
            //'editorCursor.foreground': '#002438', // corsour color
            //'editor.lineHighlightBackground': '#9B9B9B', // line highlight colour
            //'editorLineNumber.foreground': '#666666', // line number colour
            //'editor.selectionBackground': '#666666', // code selection background
            //'editor.inactiveSelectionBackground': '#7e890b'
          }
        });
      });
  }

  ngOnInit(): void {
    this.dataMapService.sharedDisp.subscribe(dispNow => {
      this.dispNow = dispNow;
      if (this.dispNow) {
        setTimeout(() => {
          this.generateTBXML();
        }, 100);
      }
    });
  }

  xmlDoc: Document | null = null;
  finishedData: string | ArrayBuffer | null = '';
  newTime: string[] = [];
  adjustArr: {
    splitName: string;
    segmentTimes: string;
    splitTimes: string;
    aboveGold: string;
  }[] = [];
  golds: number[] = [];
  goldsInc: number[] = [];
  originalGoal: number[] = [-1, -1];
  timeComp = "RealTime";
  dispNow = false;
  autoAdjust = -1; //-1 = don't adjust, 1 = auto adjust
  lsDataIndex = {gameIcon: -1, gameName: -1, categoryName: -1, layoutPath: -1, metadata: -1, offset: -1, attemptCount: -1, attemptHistory: -1, segments: -1, autoSplitterSettings: -1}

  //options and text for the xml display
  editorOptions: MonacoEditorConstructionOptions = {
    theme: 'myCustomTheme',
    language: 'xml'
  };
  code = '';

  //Create the true balanced XML tree.
  generateTBXML() {
    const argEntered = document.getElementById('argEntered');
    let goal = '3%'; //Default % off golds
    if (argEntered != null && (argEntered as HTMLInputElement).value != '') {
      goal = (argEntered as HTMLInputElement).value;
    }
    let correctFormat = true;
    let newGoal = -1;
    let sob = 0;
    //Get some variables from service and reset other variables back to empty []
    this.finishedData = this.dataMapService.getFinishedData();
    this.timeComp = this.dataMapService.getTimeCompare();
    this.lsDataIndex = this.dataMapService.getDataIndex();
    this.adjustArr = [];
    this.golds = [];
    this.goldsInc = [];
    const parser = new DOMParser();

    //We need a copy because this will be directly changed
    const xmlDoc2 = parser.parseFromString(
      this.finishedData as string,
      'text/xml'
    );
    const data = xmlDoc2.documentElement.children;
    this.xmlDoc = parser.parseFromString(
      this.finishedData as string,
      'text/xml'
    );
    //console.log(data);

    //Go through all of the segments and get the golds
    for (let i = 0; i < data[this.lsDataIndex.segments].children.length; i++) {
      //console.log(data[7].children[i].children[0]);
      let strGoldArr: string[] = []
      for (let j = 0; j < data[this.lsDataIndex.segments].children[i].children[3].children.length; j++) {
        if (data[this.lsDataIndex.segments].children[i].children[3].children[j] != null && data[this.lsDataIndex.segments].children[i].children[3].children[j].nodeName == this.timeComp) {
          strGoldArr = data[this.lsDataIndex.segments].children[i].children[3].children[j].innerHTML.split(':');
        }
      }
      const goldSec =
        parseFloat(strGoldArr[0]) * 3600 +
        parseFloat(strGoldArr[1]) * 60 +
        parseFloat(strGoldArr[2]);
      sob += goldSec;
      this.golds.push(goldSec);
      this.goldsInc.push(sob);
    }
    //console.log(newGoal);
    //Check if the user input is valid or not
    const isNum = /^\d+(\.\d+)?$/.test(goal.substring(0, goal.length - 1));
    //console.log(goal.substring(0, goal.length - 1));
    //console.log(isNum);
    if (goal[goal.length - 1] == '%' && isNum) {
      newGoal = 1 + parseFloat(goal.substring(0, goal.length - 1)) / 100;
      this.originalGoal[0] = newGoal;
      this.originalGoal[1] = parseFloat(((newGoal - 1) * 100).toFixed(2));
      //console.log("It's a percent");
    } else {
      const goalArr = goal.split(':');
      //console.log(goalArr);
      if (
        goalArr.length < 3 ||
        !/^\d{2}\d*$/.test(goalArr[0]) ||
        !/^\d{2}$/.test(goalArr[1]) ||
        !/^\d{2}\.{1}\d+$/.test(goalArr[2])
      ) {
        //console.log("Not correct format");
        correctFormat = false;
      } else {
        newGoal =
          parseFloat(goalArr[0]) * 3600 +
          parseFloat(goalArr[1]) * 60 +
          parseFloat(goalArr[2]);
        //console.log(newGoal)
        newGoal = newGoal / sob;
        this.originalGoal[0] = newGoal;
        this.originalGoal[1] = parseFloat(((newGoal - 1) * 100).toFixed(2));
      }
    }
    //console.log(newGoal)
    const formatMessage = document.getElementById('incorrectFormat');
    if (correctFormat) {
      if (formatMessage != null) formatMessage.style.visibility = 'hidden';
      this.newTime = [];

      //Convert golds to seconds, multiply by goal time and convert back to string display
      for (let j = 0; j < this.golds.length; j++) {
        let splitTime = '';
        const incTime = this.convertTimeToString(this.goldsInc[j] * newGoal);
        if (j == 0) {
          splitTime = this.convertTimeToString(this.goldsInc[j] * newGoal);
        } else {
          splitTime = this.convertTimeToString(
            (this.goldsInc[j] - this.goldsInc[j - 1]) * newGoal
          );
        }
        this.newTime.push(incTime);
        this.adjustArr.push({
          splitName: data[this.lsDataIndex.segments].children[j].children[0].innerHTML,
          segmentTimes: incTime,
          splitTimes: splitTime,
          aboveGold: ((newGoal - 1) * 100).toFixed(2)
        });
      }
      //console.log(this.newTime);
      //console.log(this.adjustArr);

      if (!this.xmlDoc) {
        throw new Error('xmlDoc missing');
      }

      //Remove all of the attempt history for the new XML file
      let i = 0;
      while (this.xmlDoc.documentElement.children[this.lsDataIndex.attemptHistory].children.length != 0) {
        const tmp = this.xmlDoc.documentElement.children[this.lsDataIndex.attemptHistory].children[0];
        //console.log(this.xmlDoc.documentElement.children[6].childNodes[i]);
        if (this.xmlDoc.documentElement.children[this.lsDataIndex.attemptHistory].childNodes[i] != null) {
          this.xmlDoc.documentElement.children[this.lsDataIndex.attemptHistory].childNodes[i].textContent =
            '';
        }
        this.xmlDoc.documentElement.children[this.lsDataIndex.attemptHistory].removeChild(tmp);
        i++;
        //this.xmlDoc.documentElement.children[6].children[i].children[2].children[0].children[0].innerHTML = newTime[i]
      }
      if (this.xmlDoc.documentElement.children[this.lsDataIndex.attemptHistory].childNodes[i] != null) {
        this.xmlDoc.documentElement.children[this.lsDataIndex.attemptHistory].childNodes[i].textContent = '';
      }

      //Remove all of the segment history for each segment for the new XML file
      for (let i = 0; i < data[this.lsDataIndex.segments].children.length; i++) {
        let j = 0;
        while (
          this.xmlDoc.documentElement.children[this.lsDataIndex.segments].children[i].children[4]
            .children.length != 0
        ) {
          const tmp = this.xmlDoc.documentElement.children[this.lsDataIndex.segments].children[i]
            .children[4].children[0];
          if (
            this.xmlDoc.documentElement.children[this.lsDataIndex.segments].children[i].children[4]
              .childNodes[j] != null
          ) {
            this.xmlDoc.documentElement.children[this.lsDataIndex.segments].children[
              i
            ].children[4].childNodes[j].textContent = '';
          }
          this.xmlDoc.documentElement.children[this.lsDataIndex.segments].children[
            i
          ].children[4].removeChild(tmp);
          j++;
        }
        if (
          this.xmlDoc.documentElement.children[this.lsDataIndex.segments].children[i].children[4]
            .childNodes[j] != null
        ) {
          this.xmlDoc.documentElement.children[this.lsDataIndex.segments].children[
            i
          ].children[4].childNodes[j].textContent = '';
        }
      }

      //Replace the current split times with the new split times obtained from the goal
      for (
        let i = 0;
        i < this.xmlDoc.documentElement.children[this.lsDataIndex.segments].children.length;
        i++
      ) {
        if (
          this.xmlDoc.documentElement.children[this.lsDataIndex.segments].children[i].children[2]
            .children[0].children[0] != null
        ) {
          this.xmlDoc.documentElement.children[this.lsDataIndex.segments].children[
            i
          ].children[2].children[0].children[0].innerHTML = this.newTime[i]; //pb
        }
        if (
          this.xmlDoc.documentElement.children[this.lsDataIndex.segments].children[i].children[2]
            .children[0].children[1] != null
        ) {
          this.xmlDoc.documentElement.children[this.lsDataIndex.segments].children[
            i
          ].children[2].children[0].children[1].innerHTML = this.newTime[i]; //pb
        }
      }
      //console.log(data);
      //console.log(this.xmlDoc.documentElement.children);
      this.code =
        '<?xml version="1.0" encoding="UTF-8"?>\n<Run version="1.7.0">' +
        this.xmlDoc.documentElement.innerHTML +
        '</Run>';
      const dataVar = document.getElementById('d2Group');
      //console.log(dataVar);
      if (dataVar) dataVar.style.visibility = 'visible';
      //this.determineDisplay();
    } else {
      if (formatMessage != null) formatMessage.style.visibility = 'visible';
    }
  }

  //Download file to user's computer
  onDownload() {
    if (this.code != '') {
      const outBlob = new Blob([this.code]);
      saveAs(outBlob, 'true_balanced_comparison.lss');
    }
  }

  showHelp() {
    //console.log("This is help");
    const output = document.getElementById('helpBox');
    if (output) output.style.visibility = 'visible';
  }

  //Updates the XML and the settings when the user makes a change to the % off golds and hits adjust
  updateGoalTimes() {
    //We need to store the original goal because using the rounded value will give the wrong values
    //console.log(this.originalGoal[0]);
    //console.log(this.originalGoal[1]);
    let isValid = true;
    //Check if everything is valid first before updating
    for (let i = 0; i < this.adjustArr.length; i++) {
      const num = (<HTMLInputElement>(
        document.getElementById('settings' + this.adjustArr[i].splitName)
      )).value;
      if (num != null && /^(\d*\.)?|\.\d+$/.test(num)) {
        //console.log(num);
      } else {
        //console.log("Invalid input");
        isValid = false;
        break;
      }
    }

    if (isValid) {
      //console.log("Everything is valid!");
      let timeChange = 0;
      for (let j = 0; j < this.adjustArr.length; j++) {
        let num = parseFloat(
          (<HTMLInputElement>(
            document.getElementById('settings' + this.adjustArr[j].splitName)
          )).value
        );
        let previousNum = num; //Used to help determine the split time and segment time values of future splits
        if (j > 0) {
          previousNum = parseFloat(
            (<HTMLInputElement>(
              document.getElementById(
                'settings' + this.adjustArr[j - 1].splitName
              )
            )).value
          );
        }
        if (this.originalGoal[1] == num) {
          num = this.originalGoal[0];
        } else {
          num = 1 + num / 100;
        }
        if (this.originalGoal[1] == previousNum) {
          previousNum = this.originalGoal[0];
        } else {
          previousNum = 1 + previousNum / 100;
        }

        if (this.autoAdjust == 1) {
          if (j == 0) {
            const currSecArr = this.adjustArr[j].segmentTimes.split(':');
            const currTotalSec =
              parseFloat(currSecArr[0]) * 3600 +
              parseFloat(currSecArr[1]) * 60 +
              parseFloat(currSecArr[2]);
            if (Math.abs(this.goldsInc[j] * num - currTotalSec) > 0.001) {
              timeChange += this.goldsInc[j] * num - currTotalSec;
            }
            this.adjustArr[j].segmentTimes = this.convertTimeToString(
              this.goldsInc[j] * num
            );
            this.adjustArr[j].splitTimes = this.convertTimeToString(
              this.goldsInc[j] * num
            );
          } else {
            const currSplitSecArr = this.adjustArr[j].segmentTimes.split(':');
            const currSplitTotalSec =
              parseFloat(currSplitSecArr[0]) * 3600 +
              parseFloat(currSplitSecArr[1]) * 60 +
              parseFloat(currSplitSecArr[2]);
            this.adjustArr[j].segmentTimes = this.convertTimeToString(
              this.goldsInc[j] * num + timeChange
            );
            if (timeChange > 0.001) {
              this.adjustArr[j].splitTimes = this.convertTimeToString(
                this.goldsInc[j] * num +
                  timeChange -
                  this.goldsInc[j - 1] * previousNum
              );
              (<HTMLInputElement>(
                document.getElementById(
                  'settings' + this.adjustArr[j].splitName
                )
              )).value = (
                ((this.goldsInc[j] * num + timeChange) / this.goldsInc[j] - 1) *
                100
              ).toString();
            } else {
              this.adjustArr[j].splitTimes = this.convertTimeToString(
                this.goldsInc[j] * num - this.goldsInc[j - 1] * previousNum
              );
            }
            if (Math.abs(this.goldsInc[j] * num - currSplitTotalSec) > 0.001) {
              timeChange += this.goldsInc[j] * num - currSplitTotalSec;
            }
          }
        } else {
          this.adjustArr[j].segmentTimes = this.convertTimeToString(
            this.goldsInc[j] * num
          );
          if (j == 0) {
            this.adjustArr[j].splitTimes = this.convertTimeToString(
              this.goldsInc[j] * num
            );
          } else {
            if (
              this.goldsInc[j] * num - this.goldsInc[j - 1] * previousNum <=
              0
            ) {
              this.adjustArr[j].splitTimes = 'split time < 0';
              isValid = false;
            } else {
              this.adjustArr[j].splitTimes = this.convertTimeToString(
                this.goldsInc[j] * num - this.goldsInc[j - 1] * previousNum
              );
            }
          }
        }
      }
    }

    if (isValid && this.xmlDoc != null) {
      for (
        let i = 0;
        i < this.xmlDoc.documentElement.children[this.lsDataIndex.segments].children.length;
        i++
      ) {
        if (
          this.xmlDoc.documentElement.children[this.lsDataIndex.segments].children[i].children[2]
            .children[0].children[0] != null
        ) {
          this.xmlDoc.documentElement.children[this.lsDataIndex.segments].children[
            i
          ].children[2].children[0].children[0].innerHTML = this.adjustArr[
            i
          ].segmentTimes; //pb
        }
        if (
          this.xmlDoc.documentElement.children[this.lsDataIndex.segments].children[i].children[2]
            .children[0].children[1] != null
        ) {
          this.xmlDoc.documentElement.children[this.lsDataIndex.segments].children[
            i
          ].children[2].children[0].children[1].innerHTML = this.adjustArr[
            i
          ].segmentTimes; //pb
        }
      }
      this.code =
        '<?xml version="1.0" encoding="UTF-8"?>\n<Run version="1.7.0">' +
        this.xmlDoc.documentElement.innerHTML +
        '</Run>';
      //this.determineDisplay();
    }
  }

  //Resets all of the times in settings to the original goal
  resetGoalTimes(replace: boolean) {
    for (let i = 0; i < this.adjustArr.length; i++) {
      if (replace) {
        (<HTMLInputElement>(
          document.getElementById('settings' + this.adjustArr[i].splitName)
        )).value = this.originalGoal[1].toString();
      }
      this.adjustArr[i].splitTimes = this.convertTimeToString(
        this.golds[i] * this.originalGoal[0]
      );
      this.adjustArr[i].segmentTimes = this.convertTimeToString(
        this.goldsInc[i] * this.originalGoal[0]
      );
      if (this.xmlDoc != null) {
        for (
          let i = 0;
          i < this.xmlDoc.documentElement.children[this.lsDataIndex.segments].children.length;
          i++
        ) {
          if (
            this.xmlDoc.documentElement.children[this.lsDataIndex.segments].children[i].children[2]
              .children[0].children[0] != null
          ) {
            this.xmlDoc.documentElement.children[this.lsDataIndex.segments].children[
              i
            ].children[2].children[0].children[0].innerHTML = this.adjustArr[
              i
            ].segmentTimes; //pb
          }
          if (
            this.xmlDoc.documentElement.children[this.lsDataIndex.segments].children[i].children[2]
              .children[0].children[1] != null
          ) {
            this.xmlDoc.documentElement.children[this.lsDataIndex.segments].children[
              i
            ].children[2].children[0].children[1].innerHTML = this.adjustArr[
              i
            ].segmentTimes; //pb
          }
        }
        this.code =
          '<?xml version="1.0" encoding="UTF-8"?>\n<Run version="1.7.0">' +
          this.xmlDoc.documentElement.innerHTML +
          '</Run>';
        //this.determineDisplay();
      }
    }
  }

  toggleGoalAdjust() {
    this.autoAdjust *= -1;
    this.resetGoalTimes(true);
    //this.updateGoalTimes();
  }

  //Converts seconds into the string that will be displayed to the user (HH:MM:SS.MS)
  convertTimeToString(time: number) {
    let retStr = '';
    let totalSeconds = time;
    const hours = Math.floor(totalSeconds / 3600);
    if (hours < 10) {
      retStr += '0';
    }
    retStr += hours + ':';
    totalSeconds %= 3600;
    const minutes = Math.floor(totalSeconds / 60);
    if (minutes < 10) {
      retStr += '0';
    }
    retStr += minutes + ':';
    const tmpSeconds = totalSeconds % 60;
    if (tmpSeconds < 10) {
      retStr += '0';
    }
    retStr += (Math.round(tmpSeconds * 1000) / 1000).toFixed(3);
    return retStr;
  }
}
