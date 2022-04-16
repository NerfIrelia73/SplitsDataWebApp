import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { convertTimeToString } from '../../helper-functions'

@Component({
  selector: 'app-general-info',
  templateUrl: './general-info.component.html',
  styleUrls: ['./general-info.component.scss']
})
export class GeneralInfoComponent implements OnInit {

  constructor() { }

  @Input() calcMethod: number = 2
  @Input() attemptHist: { ID: string, time: number }[] = []
  @Input() compRunsIDs: string[] = []

  statsChoice = '';
  completedRunsOrAttempts = '';
  totalPlaytime = '';
  timePerRun = '';

  ngOnChanges(changes: SimpleChanges) {
    console.log(changes)
    if (changes.attemptHist != null && changes.attemptHist.currentValue.length > 0) {
      this.setTotalPlaytime()
    }
  }


  ngOnInit(): void {
  }

  setTotalPlaytime() {
    console.log(this.attemptHist)
    const numInput = document.getElementById('numRuns');
    let numRuns = 0
    console.log(numInput)
    if (numInput) {
      numRuns = parseInt((numInput as HTMLInputElement).value);
    }
    let totalSec = 0;
    for (let i = 0; i < numRuns; i++) {
      if (this.calcMethod == 0 && this.attemptHist[i] != null) {
        totalSec += this.attemptHist[i].time;
      } else if (
        this.calcMethod == 1 &&
        this.attemptHist[this.attemptHist.length - numRuns + i] != null
      ) {
        totalSec += this.attemptHist[this.attemptHist.length - numRuns + i]
          .time;
        //console.log(this.attemptHist[this.attemptHist.length - numRuns + i]);
      }
    }
    if (this.calcMethod == 2) {
      for (let i = 0; i < this.attemptHist.length; i++) {
        totalSec += this.attemptHist[i].time;
      }
    }
    let start = parseInt(this.attemptHist[0].ID);
    let end = 0;
    if (this.calcMethod >= 3) {
      //console.log(this.compRunsIDs)
      //console.log(this.attemptHist)
      if (this.calcMethod == 3) {
        end = parseInt(this.compRunsIDs[numRuns - 1]);
      } else if (this.calcMethod == 4) {
        if (this.compRunsIDs.length - numRuns - 1 < 0) {
          start = parseInt(this.attemptHist[0].ID)
        } else {
          start = parseInt(this.compRunsIDs[this.compRunsIDs.length - numRuns - 1]) + 1;
        }
        end = parseInt(this.compRunsIDs[this.compRunsIDs.length - 1]);
      } else if (this.calcMethod == 5) {
        end = parseInt(this.compRunsIDs[this.compRunsIDs.length - 1]);
      }
      //console.log(this.compRunsIDs)
      //console.log(this.attemptHist)
      //console.log(start)
      //console.log(end)
      for (let i = start; i <= end; i++) {
        //console.log(i)
        const index = this.attemptHist.findIndex(k => parseInt(k.ID) == i)
        if (index != -1) {
          totalSec += this.attemptHist[index].time;
        }
      }
    }
    this.findCompletedRunsOrAttempts(totalSec, numRuns);
    this.setStatsChoice(numRuns)
    const tmp = convertTimeToString(totalSec, true);
    this.totalPlaytime = 'You spent a total of ' + tmp + ' playing this game';
  }

  findCompletedRunsOrAttempts(time: number, num: number) {
    let count = 0;
    for (let i = 0; i < this.compRunsIDs.length; i++) {
      if (this.calcMethod == 0 && parseInt(this.compRunsIDs[i]) < num) {
        count++;
      } else if (
        this.calcMethod == 1 &&
        parseInt(this.compRunsIDs[i]) >
          parseInt(this.attemptHist[this.attemptHist.length - 1 - num].ID)
      ) {
        count++;
      } else if (this.calcMethod == 2) {
        count = this.compRunsIDs.length;
        break;
      }
    }
    if (this.calcMethod == 3) {
      count = parseInt(this.compRunsIDs[num - 1]);
    } else if (this.calcMethod == 4) {
      if (this.compRunsIDs.length - num - 1 < 0) {
        count = parseInt(this.compRunsIDs[this.compRunsIDs.length - 1])
      } else {
        count =
          parseInt(this.compRunsIDs[this.compRunsIDs.length - 1]) -
          parseInt(this.compRunsIDs[this.compRunsIDs.length - num - 1]);
      }
    } else if (this.calcMethod == 5) {
      count =
        parseInt(this.compRunsIDs[this.compRunsIDs.length - 1]);
    }
    //console.log("Count: " + count);
    let tmp = '';
    if (this.calcMethod <= 2) {
      this.completedRunsOrAttempts = 'You completed ' + count + ' runs';
      tmp = convertTimeToString(time / count, true);
    } else {
      if (this.calcMethod == 5) {
        tmp = convertTimeToString(time / this.compRunsIDs.length, true);
      } else {
        tmp = convertTimeToString(time / num, true);
      }
      this.completedRunsOrAttempts =
        'It took you ' + count + ' attempts to complete all of these runs';
    }
    this.timePerRun =
      'This means, during this time period, you completed 1 run every ' + tmp;
  }

  setStatsChoice(numRuns: number) {
    if (this.calcMethod == 0) {
      this.statsChoice = 'Over your first ' + numRuns + ' attempts:';
    } else if (this.calcMethod == 1) {
      this.statsChoice = 'Over your last ' + numRuns + ' attempts:';
    } else if (this.calcMethod == 2) {
      this.statsChoice = 'Over all of your attempts:';
    } else if (this.calcMethod == 3) {
      this.statsChoice = 'Over your first ' + numRuns + ' completed runs:';
    } else if (this.calcMethod == 4) {
      this.statsChoice = 'Over your last ' + numRuns + ' completed runs:';
    } else if (this.calcMethod == 5) {
      this.statsChoice = 'Over all of your completed runs:';
    }
  }
}
