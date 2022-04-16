import { Component, OnInit } from '@angular/core';
import { DataMapService } from '../data-map.service';
import {
  ChartType,
  ChartDataSets,
  InteractionMode,
  ChartTooltipItem,
  ChartData
} from 'chart.js';
import { Color, Label, MultiDataSet, SingleDataSet } from 'ng2-charts';
import { SafeResourceUrl } from '@angular/platform-browser';
import { determineValidInput } from '../helper-functions'

@Component({
  selector: 'app-ls-statistics',
  templateUrl: './ls-statistics.component.html',
  styleUrls: ['./ls-statistics.component.scss']
})
export class LsStatisticsComponent implements OnInit {
  constructor(private dataMapService: DataMapService) {}

  ngOnInit(): void {
    this.dataMapService.sharedDisp.subscribe(dispNow => {
      this.dispNow = dispNow;
      if (this.dispNow) {
        setTimeout(() => {
          this.submitData();
        }, 100);
      }
    });
  }

  dataMap: {
    splitName: string;
    segmentTimes: { ID: string; time: string }[];
    subsplitSegmentTimes: { ID: string; time: string }[],
    numSubsplits: number;
  }[] = [];
  statsMap: {
    splitName: string;
    splitNum: string;
    finalStats: string[][];
  }[] = [];
  pbMap: {
    splitNum: number,
    splitName: string,
    splitIcon: SafeResourceUrl,
    splitTime: string,
    subsplitTime: string,
    runTime: string,
  }[] = [];
  attemptHist: { ID: string, time: number }[] = [];
  chartData: { Attempt: string, Time: number }[] = [];
  lsDataIndex = {gameIcon: -1, gameName: -1, categoryName: -1, layoutPath: -1, metadata: -1, offset: -1, attemptCount: -1, attemptHistory: -1, segments: -1, autoSplitterSettings: -1}
  calcMethod = 2;
  sortMethod = 0;
  compRunsIDs: string[] = [];
  maxId = -1;
  trueMinId = 1;
  finishedData: string | ArrayBuffer | null = '';
  timeComp = "RealTime";
  statsChoice = '';
  completedRunsOrAttempts = '';
  totalPlaytime = '';
  timePerRun = '';
  dispNow = false;
  firstTime = true;
  combineSubsplits = 1; //1 = show, -1 = hide

  lineChartData: ChartDataSets[] = [];

  lineChartLabels: Label[] = [];

  lineChartOptions = {
    responsive: true,
    tooltips: {
      mode: 'index' as InteractionMode,
      intersect: false,
      callbacks: {
        label: function(context: ChartTooltipItem) {
          let totalSeconds = parseFloat(context.value as string);
          let retStr = '';
          if (totalSeconds >= 3600) {
            const hours = Math.floor(totalSeconds / 3600);
            if (hours < 10) {
              retStr += '0';
            }
            retStr += hours + ':';
            totalSeconds = totalSeconds % 3600;
          }
          const minutes = Math.floor(totalSeconds / 60);
          if (minutes < 10) {
            retStr += '0';
          }
          retStr += minutes + ':';
          totalSeconds = totalSeconds % 60;
          if (totalSeconds < 10) {
            retStr += '0';
          }
          retStr += (Math.round(totalSeconds * 1000) / 1000).toFixed(3);
          return 'Time: ' + retStr;
        }
      }
    },
    hover: {
      mode: 'nearest' as InteractionMode,
      intersect: true
    },
    elements: {
      point: {
        radius: 0
      }
    },
    scales: {
      xAxes: [
        {
          scaleLabel: {
            display: true,
            labelString: 'Attempt'
          }
        }
      ],
      yAxes: [
        {
          scaleLabel: {
            display: true,
            labelString: 'Time'
          },
          ticks: {
            callback: function(value: number) {
              let retStr = '';
              let totalSeconds = value;
              if (totalSeconds >= 3600) {
                const hours = Math.floor(totalSeconds / 3600);
                if (hours < 10) {
                  retStr += '0';
                }
                retStr += hours + ':';
                totalSeconds = totalSeconds % 3600;
              }
              const minutes = Math.floor(totalSeconds / 60);
              if (minutes < 10) {
                retStr += '0';
              }
              retStr += minutes + ':';
              totalSeconds = totalSeconds % 60;
              if (totalSeconds < 10) {
                retStr += '0';
              }
              retStr += (Math.round(totalSeconds * 1000) / 1000).toFixed(3);
              return retStr;
            }
          }
        }
      ]
    }
  };

  lineChartColors: Color[] = [];

  lineChartLegend = true;
  lineChartPlugins = [];
  lineChartType = 'line' as ChartType;

  doughnutChartOptions = {
    tooltips: {
      callbacks: {
        label: function(tooltipItem: ChartTooltipItem, data: ChartData) {
          if (
            data.labels != null &&
            data.datasets != null &&
            data.datasets[0].data != null
          ) {
            let total = 0;
            for (let i = 0; i < data.datasets[0].data.length; i++) {
              total += data.datasets[0].data[i] as number;
            }
            const tmp =
              data.labels[tooltipItem.index as number] +
              ': ' +
              data.datasets[0].data[tooltipItem.index as number] +
              ' (' +
              (
                ((data.datasets[0].data[
                  tooltipItem.index as number
                ] as number) /
                  total) *
                100
              ).toFixed(2) +
              '%)';
            return tmp;
          } else {
            return 'Error getting data';
          }
        }
      }
    },
    hoverOffset: 300
  };

  doughnutChartLabels: Label[] = [];
  doughnutChartData: MultiDataSet = [];
  doughnutChartType: ChartType = 'doughnut';
  doughnutChartColors: Color[] = [];

  submitData() {
    if (determineValidInput(this.calcMethod, this.attemptHist, this.compRunsIDs)) {
      console.log("We got here bois")
      this.pbMap = this.dataMapService.getPBMap();
      this.dataMap = this.dataMapService.getDataMap();
      this.timeComp = this.dataMapService.getTimeCompare();
      this.attemptHist = this.dataMapService.getAttemptHist();
      this.compRunsIDs = this.dataMapService.getCompRunsIDs();
      this.lsDataIndex = this.dataMapService.getDataIndex();
      this.chartData = [];
      this.calcMaxMinIds();
      //console.log(this.dataMap);
      this.statsMap = [];
      //console.log("Calc Method: " + this.calcMethod);
      for (let i = 0; i < this.dataMap.length; i++) {
        const timeArr = this.getTimeArr(i);
        const gold = Math.min(...timeArr);
        let stats = this.calcStats(timeArr); //returns [mean, median, stdDev]
        stats.push(gold);

        const cleanTimeArr = this.removeOutliers(
          i,
          stats[0],
          stats[2],
          timeArr
        );
        stats = this.calcStats(cleanTimeArr);
        stats.push(gold);
        const convStats: string[][] = [];
        for (let k = 0; k < stats.length; k++) {
          if (stats[0] == -1) {
            convStats.push(['No Data', '-1']);
            convStats.push(['No Data', '-1']);
            convStats.push(['No Data', '-1']);
            convStats.push(['No Data', '-1']);
            break;
          }
          const convTime = this.convertTimeToString(stats[k], false);
          const finalTime = [convTime, stats[k].toString()];
          convStats.push(finalTime);
        }
        this.statsMap.push({
          splitName: this.dataMap[i].splitName,
          splitNum: (i + 1).toString(),
          finalStats: convStats
        });
      }
      this.statsMap.sort((a, b) =>
        parseFloat(b.splitNum) < parseFloat(a.splitNum) ? 1 : -1
      );
      //console.log(this.statsMap);
      //console.log(this.chartData);
      this.calcChartData();
      this.calcResetChart();
      const tmpData = [];
      const tmpData2 = [];
      for (let i = 0; i < this.chartData.length; i++) {
        tmpData.push(this.chartData[i].Attempt);
        tmpData2.push(this.chartData[i].Time);
      }
      //console.log(tmpData2);
      this.lineChartData = [];
      this.lineChartColors = [];
      this.lineChartData.push({ data: tmpData2, label: 'Attempts vs Time' });
      this.lineChartLabels = tmpData;
      this.lineChartColors.push({
        borderColor: 'orange'
      });
      //console.log(this.lineChartData);
      this.firstTime = false;
      const dataVar = document.getElementById('d1Group');
      if (dataVar) dataVar.style.visibility = 'visible';
    }
  }

  //Not sure if there is a stats library for js so we gotta do it the ol fashion way
  calcStats(timeArr: number[]) {
    if (timeArr.length <= 1) {
      return [-1, -1, -1];
    }
    const sumSec = timeArr.reduce((a, b) => a + b, 0);
    const mean = sumSec / timeArr.length;
    const midPoint = Math.floor(timeArr.length / 2);
    const tmpNums = [...timeArr].sort((a, b) => a - b);
    const median =
      timeArr.length % 2 !== 0
        ? tmpNums[midPoint]
        : (tmpNums[midPoint - 1] + tmpNums[midPoint]) / 2;
    let sumDev = 0;
    for (let k = 0; k < timeArr.length; k++) {
      sumDev += Math.pow(timeArr[k] - mean, 2);
    }
    const stdDev = Math.sqrt(sumDev / (timeArr.length - 1));
    return [mean, median, stdDev];
  }

  //Removes outliers based on a z-score of 2.  Seems to be more accurate than a z-score of 3
  removeOutliers(num: number, mean: number, stdDev: number, timeArr: number[]) {
    for (let k = 0; k < timeArr.length; k++) {
      const result = (timeArr[k] - mean) / stdDev;
      if (result > 2 || result < -2) {
        //console.log("Z Score: " + result);
        //console.log(k);
        //console.log(timeArr.length);
        //console.log(this.dataMap[num].segmentTimes);
        timeArr.splice(k, 1);
        k--;
      }
    }
    return timeArr;
  }

  //Gets the appropriate times from the data map and converts them to seconds
  getTimeArr(num: number) {
    const tmpArr = [];
    let check = false;
    for (let j = 0; j < this.dataMap[num].segmentTimes.length; j++) {
      check = this.checkCondition(this.dataMap[num].segmentTimes[j].ID);
      //console.log(this.dataMap[num].segmentTimes[j].ID)
      //console.log(check)
      if (check) {
        if (this.combineSubsplits == 1) {
          const convertArr = this.dataMap[num].segmentTimes[j].time.split(':');
          const seconds =
          parseFloat(convertArr[0]) * 3600 +
          parseFloat(convertArr[1]) * 60 +
          parseFloat(convertArr[2]);
          tmpArr.push(seconds);
        } else if (this.dataMap[num].splitName[0] != '-' && this.dataMap[num].subsplitSegmentTimes[j] != null) {
          //console.log("We made it here")
          const convertArr = this.dataMap[num].subsplitSegmentTimes[j].time.split(':');
          const seconds =
          parseFloat(convertArr[0]) * 3600 +
          parseFloat(convertArr[1]) * 60 +
          parseFloat(convertArr[2]);
          tmpArr.push(seconds);
        }
      }
    }
    return tmpArr;
  }

  calcChartData() {
    const option = document.getElementById('dropSplits')?.innerHTML;
    //console.log(this.compRunsIDs);
    //console.log("We are calc chart data");
    //console.log(option);
    if (option == 'General' || this.firstTime) {
      for (let i = 0; i < this.compRunsIDs.length; i++) {
        let overallSec = 0;
        for (let j = 0; j < this.dataMap.length; j++) {
          if (this.combineSubsplits == 1) {
            const tmp = this.dataMap[j].segmentTimes.findIndex(
              k => k.ID == this.compRunsIDs[i]
            );
            if (tmp != -1 && this.dataMap[j].segmentTimes[tmp].time != null) {
              const convertArr = this.dataMap[j].segmentTimes[tmp].time.split(
                ':'
              );
              const seconds =
                parseFloat(convertArr[0]) * 3600 +
                parseFloat(convertArr[1]) * 60 +
                parseFloat(convertArr[2]);
              overallSec += seconds;
            }
          } else {
            const tmp = this.dataMap[j].subsplitSegmentTimes.findIndex(
              k => k.ID == this.compRunsIDs[i]
            );
            if (
              tmp != -1 &&
              this.dataMap[j].subsplitSegmentTimes[tmp].time != null
            ) {
              const convertArr = this.dataMap[j].subsplitSegmentTimes[
                tmp
              ].time.split(':');
              const seconds =
                parseFloat(convertArr[0]) * 3600 +
                parseFloat(convertArr[1]) * 60 +
                parseFloat(convertArr[2]);
              overallSec += seconds;
            }
          }
        }
        const check = this.checkCondition(this.compRunsIDs[i]);
        if (check) {
          this.chartData.push({
            Attempt: this.compRunsIDs[i],
            Time: overallSec
          });
        }
      }
    } else {
      for (let i = 0; i < this.dataMap.length; i++) {
        if (this.combineSubsplits == 1) {
          for (let j = 0; j < this.dataMap[i].segmentTimes.length; j++) {
            if (this.dataMap[i].splitName != option) {
              break;
            } else {
              const check = this.checkCondition(
                this.dataMap[i].segmentTimes[j].ID
              );
              if (check) {
                const convertArr = this.dataMap[i].segmentTimes[j].time.split(
                  ':'
                );
                const seconds =
                  parseFloat(convertArr[0]) * 3600 +
                  parseFloat(convertArr[1]) * 60 +
                  parseFloat(convertArr[2]);
                this.chartData.push({
                  Attempt: this.dataMap[i].segmentTimes[j].ID,
                  Time: seconds
                });
              }
            }
          }
        } else {
          for (
            let j = 0;
            j < this.dataMap[i].subsplitSegmentTimes.length;
            j++
          ) {
            if (this.dataMap[i].splitName != option) {
              break;
            } else {
              const check = this.checkCondition(
                this.dataMap[i].subsplitSegmentTimes[j].ID
              );
              if (check) {
                const convertArr = this.dataMap[i].subsplitSegmentTimes[
                  j
                ].time.split(':');
                const seconds =
                  parseFloat(convertArr[0]) * 3600 +
                  parseFloat(convertArr[1]) * 60 +
                  parseFloat(convertArr[2]);
                this.chartData.push({
                  Attempt: this.dataMap[i].subsplitSegmentTimes[j].ID,
                  Time: seconds
                });
              }
            }
          }
        }
      }
    }
  }

  calcResetChart() {
    this.doughnutChartLabels = [];
    this.doughnutChartData = [];
    this.doughnutChartColors = [];
    const resetArr: SingleDataSet = [];
    const resetColors: string[] = [];
    const resetMap = new Map();
    const resetTimeMap = new Map();
    resetTimeMap.set('first third of the split', 0);
    resetTimeMap.set('second third of the split', 0);
    resetTimeMap.set('last third of the split', 0);
    resetTimeMap.set('longer than the median of the split', 0);
    const splitOption = document.getElementById('dropSplits') as HTMLElement;
    let option = '';
    if (splitOption != null) {
      option = splitOption.innerHTML;
    }
    //console.log(option);
    const resetTitle = document.getElementById('resetChartTitle');
    const medianTitle = document.getElementById('medianSplitTime');
    //console.log(resetTitle);
    if (option == 'General' || this.firstTime) {
      if (resetTitle != null) {
        resetTitle.innerHTML = 'Resets per Split';
      }
      if (medianTitle != null) {
        medianTitle.style.visibility = 'hidden';
      }
      for (let i = 0; i < this.attemptHist.length; i++) {
        const check = this.checkCondition(this.attemptHist[i].ID);
        if (check) {
          for (let j = 0; j < this.dataMap.length; j++) {
            const tmp = this.dataMap[j].segmentTimes.findIndex(
              k => k.ID == this.attemptHist[i].ID
            );
            if (
              tmp == -1 &&
              this.dataMap[j].segmentTimes.length > 0 &&
              parseInt(this.dataMap[j].segmentTimes[0].ID) <=
                parseInt(this.attemptHist[i].ID)
            ) {
              if (this.combineSubsplits == -1) {
                while (
                  this.dataMap[j].splitName[0] == '-' &&
                  j <= this.dataMap.length
                ) {
                  j++;
                }
              }
              if (resetMap.get(this.dataMap[j].splitName) == null) {
                resetMap.set(this.dataMap[j].splitName, 1);
              } else {
                const times = resetMap.get(this.dataMap[j].splitName) + 1;
                resetMap.set(this.dataMap[j].splitName, times);
              }
              break;
            }
          }
        }
      }
      resetMap.forEach((value, key) => {
        resetArr.push(value);
        this.doughnutChartLabels.push(key);
        resetColors.push(
          '#' + Math.floor(Math.random() * 16777215).toString(16)
        );
      });
      //console.log(resetMap);
      //console.log(resetArr);
      this.doughnutChartData.push(resetArr);
      this.doughnutChartColors.push({
        backgroundColor: resetColors
      });
    } else {
      //I think for splits we can grab how far into the split you reset
      if (resetTitle != null) {
        resetTitle.innerHTML = 'Where resets take place';
      }
      for (let i = 0; i < this.attemptHist.length; i++) {
        const check = this.checkCondition(this.attemptHist[i].ID);
        let totalSec = 0;
        if (check) {
          for (let j = 0; j < this.dataMap.length; j++) {
            if (this.combineSubsplits == -1) {
              while (
                this.dataMap[j].splitName[0] == '-' &&
                j <= this.dataMap.length
              ) {
                j++;
              }
            }
            const tmp = this.dataMap[j].segmentTimes.findIndex(
              k => k.ID == this.attemptHist[i].ID
            );
            if (
              tmp == -1 &&
              this.dataMap[j].segmentTimes.length > 0 &&
              parseInt(this.dataMap[j].segmentTimes[0].ID) <=
                parseInt(this.attemptHist[i].ID)
            ) {
              //console.log(option);
              //console.log(this.dataMap[j].splitName);
              if (option != null && this.dataMap[j].splitName == option) {
                const resetTime = this.attemptHist[i].time - totalSec;
                const medianIndex = this.statsMap.findIndex(
                  k => k.splitName == option
                );
                const medianTime = parseFloat(
                  this.statsMap[medianIndex].finalStats[1][1]
                );
                if (medianTitle != null) {
                  medianTitle.innerHTML =
                    'Median of split: ' +
                    this.convertTimeToString(medianTime, false);
                  medianTitle.style.visibility = 'visible';
                }
                //console.log(medianTime / resetTime);
                if (resetTime / medianTime <= 0.33) {
                  const num = resetTimeMap.get('first third of the split') + 1;
                  resetTimeMap.set('first third of the split', num);
                } else if (
                  resetTime / medianTime > 0.33 &&
                  resetTime / medianTime <= 0.66
                ) {
                  const num = resetTimeMap.get('second third of the split') + 1;
                  resetTimeMap.set('second third of the split', num);
                } else if (
                  resetTime / medianTime > 0.66 &&
                  resetTime / medianTime <= 1.0
                ) {
                  const num = resetTimeMap.get('last third of the split') + 1;
                  resetTimeMap.set('last third of the split', num);
                } else {
                  const num =
                    resetTimeMap.get('longer than the median of the split') + 1;
                  resetTimeMap.set('longer than the median of the split', num);
                }
              }
              break;
            } else if (
              this.dataMap[j].segmentTimes.length > 0 &&
              parseInt(this.dataMap[j].segmentTimes[0].ID) <=
                parseInt(this.attemptHist[i].ID)
            ) {
              const convertArr = this.dataMap[j].segmentTimes[tmp].time.split(
                ':'
              );
              const seconds =
                parseFloat(convertArr[0]) * 3600 +
                parseFloat(convertArr[1]) * 60 +
                parseFloat(convertArr[2]);
              totalSec += seconds;
            }
          }
        }
      }
      resetTimeMap.forEach((value, key) => {
        resetArr.push(value);
        this.doughnutChartLabels.push(key);
        resetColors.push(
          '#' + Math.floor(Math.random() * 16777215).toString(16)
        );
      });
      //console.log(resetTimeMap);
      //console.log(resetArr);
      this.doughnutChartData.push(resetArr);
      this.doughnutChartColors.push({
        backgroundColor: resetColors
      });
    }
  }

  //Return true if the attempt id is within the correct set of attempt ids else return false
  //0: Data from first attempts, 1: Data from last attempts, 2: Data from all attempts,
  //3: Data from first completed runs, 4: Data from last completed runs, 5: Data from all completed runs
  checkCondition(num: string) {
    const numInput = document.getElementById('numRuns');
    let numRuns = 0;
    if (numInput) {
      numRuns = parseInt((numInput as HTMLInputElement).value);
    }
    const numAsNum = parseInt(num);
    if (this.calcMethod == 0 && numAsNum <= numRuns + this.trueMinId) {
      return true;
    } else if (this.calcMethod == 1 && numAsNum >= this.maxId - numRuns) {
      return true;
    } else if (this.calcMethod == 2) {
      return true;
    } else if (this.calcMethod == 3 && this.compRunsIDs.includes(num) && this.compRunsIDs.indexOf(num) <= numRuns) {
      return true;
    } else if (this.calcMethod == 4 && this.compRunsIDs.includes(num) && this.compRunsIDs.indexOf(num) >= this.compRunsIDs.length - numRuns) {
      return true;
    } else if (this.calcMethod == 5 && this.compRunsIDs.includes(num)) {
        return true;
    }
    return false;
  }

  //Toggle the dropdown menus
  toggleMenu(num: number) {
    if (num == 0) {
      document.getElementById('dropdownOptions')?.classList.toggle('show');
    } else if (num == 1) {
      document.getElementById('dropdownChoices')?.classList.toggle('show');
    } else if (num == 2) {
      document.getElementById('dropdownSplits')?.classList.toggle('show');
    }
  }

  toggleSubsplits() {
    this.combineSubsplits *= -1;
    this.submitData();
  }

  //Change text of the dropdown menus onclick and change the calc method for stats
  changeText(optionName: string, num: number) {
    //console.log("Hi friend");
    if (num == 0) {
      const output = document.getElementById('dropTitle');
      const option = document.getElementById(optionName)?.innerHTML.toString();
      if (output && option != null) {
        this.calcMethod = parseInt(optionName[optionName.length - 1]);
        output.innerHTML = option;
        document.getElementById('dropdownOptions')?.classList.toggle('show');
      }
    } else if (num == 1) {
      const output = document.getElementById('dropSplits');
      if (output) {
        output.innerHTML = optionName;
        document.getElementById('dropdownSplits')?.classList.toggle('show');
        this.submitData();
      }
    }
  }

  //User can click on text to sort by mean, median, deviation, gold, or split name
  reorderData(num: number) {
    if (num == 0) {
      if (this.sortMethod == num) {
        this.statsMap.sort((a, b) =>
          parseFloat(b.splitNum) > parseFloat(a.splitNum) ? -1 : 1
        );
        num = -1;
      } else {
        this.statsMap.sort((a, b) =>
          parseFloat(b.splitNum) < parseFloat(a.splitNum) ? -1 : 1
        );
      }
    } else if (num == 1) {
      if (this.sortMethod == num) {
        this.statsMap.sort((a, b) => (b.splitName > a.splitName ? 1 : -1));
        num = -1;
      } else {
        this.statsMap.sort((a, b) => (b.splitName < a.splitName ? 1 : -1));
      }
    } else {
      if (this.sortMethod == num) {
        //console.log(this.statsMap);
        this.statsMap.sort((a, b) =>
          parseFloat(b.finalStats[num - 2][1]) <
          parseFloat(a.finalStats[num - 2][1])
            ? 1
            : -1
        );
        num = -1;
        //console.log(this.statsMap);
      } else {
        //console.log(this.statsMap);
        this.statsMap.sort((a, b) =>
          parseFloat(b.finalStats[num - 2][1]) >
          parseFloat(a.finalStats[num - 2][1])
            ? 1
            : -1
        );
        //console.log(this.statsMap);
      }
    }
    this.sortMethod = num;
  }

  //Find the true min id because livesplit doesn't know what it's doing sometimes
  calcMaxMinIds() {
    this.finishedData = this.dataMapService.getFinishedData();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(
      this.finishedData as string,
      'text/xml'
    ); //parse data from file
    //console.log(xmlDoc);
    const data = xmlDoc.documentElement.children;
    //console.log(xmlDoc.documentElement);
    const attempts = parseInt(data[this.lsDataIndex.attemptCount].innerHTML);
    this.maxId = data[this.lsDataIndex.attemptHistory].childElementCount;
    if (this.maxId > attempts) {
      this.trueMinId = this.maxId - attempts;
    }
  }

  //Converts seconds into the string that will be displayed to the user (HH:MM:SS.MS)
  convertTimeToString(time: number, needD: boolean) {
    let retStr = '';
    let totalSeconds = time;
    if (needD) {
      const days = Math.floor(totalSeconds / 86400);
      if (days < 10) {
        retStr += '0';
      }
      retStr += days + ':';
      totalSeconds %= 86400;
    }
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
