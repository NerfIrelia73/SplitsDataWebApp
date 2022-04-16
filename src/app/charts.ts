import {
    ChartType,
    ChartDataSets,
    InteractionMode,
    ChartTooltipItem,
    ChartData
  } from 'chart.js';
  import { Color, Label, MultiDataSet, SingleDataSet } from 'ng2-charts';

export const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      xAxes: [
        {
          scaleLabel: {
            display: true,
            labelString: 'Split'
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
    },
    tooltips: {
      callbacks: {
        label: function(tooltipItem: ChartTooltipItem, data: ChartData) {
          let retStr = '';
          let totalSeconds = 0;
          if (
            data.labels != null &&
            data.datasets != null &&
            data.datasets[0].data != null &&
            tooltipItem.datasetIndex == 0
          ) {
            totalSeconds = data.datasets[0].data[
              tooltipItem.index as number
            ] as number;
          } else if (
            data.labels != null &&
            data.datasets != null &&
            data.datasets[1].data != null &&
            tooltipItem.datasetIndex == 1
          ) {
            totalSeconds = data.datasets[1].data[
              tooltipItem.index as number
            ] as number;
          } else if (
            data.labels != null &&
            data.datasets != null &&
            data.datasets[2].data != null &&
            tooltipItem.datasetIndex == 2
          ) {
            totalSeconds = data.datasets[2].data[
              tooltipItem.index as number
            ] as number;
          } else {
            return 'Information not found';
          }
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
      },
      hover: {
        mode: 'nearest' as InteractionMode,
        intersect: false
      }
    }
  };

  export const barChartColors: Color[] = [
    {
      backgroundColor: 'green'
    },
    {
      backgroundColor: 'gold'
    },
    {
      backgroundColor: 'blue'
    }
  ];