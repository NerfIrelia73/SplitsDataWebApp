import { Component, OnInit, Input, SimpleChanges } from '@angular/core';
import { SafeResourceUrl } from '@angular/platform-browser';
import { DataMapService } from '../../data-map.service';
import {
  ChartType,
  ChartDataSets,
} from 'chart.js';
import { Label } from 'ng2-charts';
import { barChartOptions, barChartColors } from '../../charts'
import { determineValidInput } from 'src/app/helper-functions';

@Component({
  selector: 'app-personal-best',
  templateUrl: './personal-best.component.html',
  styleUrls: ['./personal-best.component.scss']
})
export class PersonalBestComponent implements OnInit {

  constructor(private dataMapService: DataMapService) {}

  @Input() calcMethod: number = 2
  @Input() attemptHist: { ID: string; time: number }[] = []
  @Input() compRunsIDs: string[] = []
  @Input() statsMap: { splitName: string; splitNum: string; finalStats: string[][] }[] = []
  @Input() pbMap: {
    splitNum: number;
    splitName: string;
    splitIcon: SafeResourceUrl;
    splitTime: string;
    subsplitTime: string;
    runTime: string;
  }[] = []

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.statsMap != null && changes.statsMap.currentValue.length > 0) {
      this.calcBarChart()
    }
  }

  combineSubsplits = 1; //1 = show, -1 = hide
  barChartLabels: Label[] = [];
  barChartType: ChartType = 'bar';
  barChartLegend = true;
  barChartPlugins = [];
  barChartData: ChartDataSets[] = [];
  barChartOptions = barChartOptions
  barChartColors = barChartColors

  calcPBData() {
    if (determineValidInput(this.calcMethod, this.attemptHist, this.compRunsIDs)) {
      this.pbMap = this.dataMapService.getPBMap();
    }
  }

  calcBarChart() {
    this.barChartData = [];
    this.barChartLabels = [];
    const tmpArr: number[][] = [[], [], []];
    const labelArr: string[] = [];
    const barChartWrapper = document.getElementById('barChartWrapper');
    if (barChartWrapper) {
      const len = this.statsMap.length * 7.5;
      if (len < 100) {
        barChartWrapper.style.width = '100%';
      } else {
        barChartWrapper.style.width = len.toString() + '%';
      }
    }
    for (let i = 0; i < this.statsMap.length; i++) {
      if (this.pbMap[i].splitName[0] != '-' || this.combineSubsplits == 1) {
        let pbTime = this.pbMap[i].splitTime.split(':');
        if (this.combineSubsplits == -1) {
          pbTime = this.pbMap[i].subsplitTime.split(':');
        }
        const goldTime = this.statsMap[i].finalStats[3][0].split(':');
        const secDiff =
          parseFloat(pbTime[0]) * 3600 +
          parseFloat(pbTime[1]) * 60 +
          parseFloat(pbTime[2]) -
          (parseFloat(goldTime[0]) * 3600 +
            parseFloat(goldTime[1]) * 60 +
            parseFloat(goldTime[2]));

        labelArr.push(this.pbMap[i].splitName);
        let secConv = this.pbMap[i].splitTime.split(':');
        if (this.combineSubsplits == -1) {
          secConv = this.pbMap[i].subsplitTime.split(':');
        }
        tmpArr[0].push(
          parseFloat(secConv[0]) * 3600 +
            parseFloat(secConv[1]) * 60 +
            parseFloat(secConv[2])
        );
        secConv = this.statsMap[i].finalStats[3][0].split(':');
        tmpArr[1].push(
          parseFloat(secConv[0]) * 3600 +
            parseFloat(secConv[1]) * 60 +
            parseFloat(secConv[2])
        );
        tmpArr[2].push(secDiff);
      }
    }

    this.barChartData.push({ data: tmpArr[0], label: 'PB' });
    this.barChartData.push({ data: tmpArr[1], label: 'Gold' });
    this.barChartData.push({ data: tmpArr[2], label: 'Possible timesave' });
    this.barChartLabels = labelArr;
    //console.log(this.barChartData);
  }

}
