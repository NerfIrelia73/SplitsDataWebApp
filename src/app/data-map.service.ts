import { Injectable } from '@angular/core';
import { SafeResourceUrl } from '@angular/platform-browser';
import { BehaviorSubject } from 'rxjs';
import { SafeSubscriber } from 'rxjs/internal/Subscriber';

@Injectable({
  providedIn: 'root'
})
export class DataMapService {

  constructor() { }

  private dataMap: {splitName: string, segmentTimes: {ID: string, time: string}[], subsplitSegmentTimes: {ID: string, time: string}[], numSubsplits: number}[] = [];
  private pbMap: {splitNum: number, splitName: string, splitIcon: SafeResourceUrl, splitTime: string, subsplitTime: string, runTime: string}[] = [];
  private finishedData: string | ArrayBuffer | null = '';
  private timeComp = "RealTime"; //RealTime or GameTime
  private attemptHist: {ID: string, time: number}[] = [];
  private compRuns: string[] = [];
  private lsDataIndex = {gameIcon: -1, gameName: -1, categoryName: -1, layoutPath: -1, metadata: -1, offset: -1, attemptCount: -1, attemptHistory: -1, segments: -1, autoSplitterSettings: -1}
  private dispDivs = new BehaviorSubject(false);
  sharedDisp = this.dispDivs.asObservable();

  public setDataMap(conf: {splitName: string, segmentTimes: {ID: string, time: string}[], subsplitSegmentTimes: {ID: string, time: string}[], numSubsplits: number}[]): void {
    this.dataMap = conf;
    //console.log("This is out data map");
    //console.log(this.dataMap);
  }

  public getDataMap(): {splitName: string, segmentTimes: {ID: string, time: string}[], subsplitSegmentTimes: {ID: string, time: string}[], numSubsplits: number}[] {
    return this.dataMap;
  }

  public setFinishedData(conf: string | ArrayBuffer | null): void {
    this.finishedData = conf;
    //console.log("This is our finished data");
    //console.log(this.finishedData);
  }

  public getFinishedData(): string | ArrayBuffer | null {
    return this.finishedData;
  }

  public setTimeCompare(conf: string): void {
    this.timeComp = conf;
    //console.log("This is our timeComp");
    //console.log(this.timeComp);
  }

  public getTimeCompare(): string {
    return this.timeComp;
  }

  public setAttemptHist(conf: {ID: string, time: number}[]): void {
    this.attemptHist = conf;
    //console.log("This is our timeComp");
    //console.log(this.attemptHist);
  }

  public getAttemptHist(): {ID: string, time: number}[] {
    return this.attemptHist;
  }

  public setCompRunsIDs(conf: string[]): void {
    this.compRuns = conf;
    //console.log("This is our timeComp");
    //console.log(this.compRuns);
  }

  public getCompRunsIDs(): string[] {
    return this.compRuns;
  }

  public setPBMap(conf: {splitNum: number, splitName: string, splitIcon: SafeResourceUrl, splitTime: string, subsplitTime: string, runTime: string}[]): void {
    this.pbMap = conf;
  }

  public getPBMap(): {splitNum: number, splitName: string, splitIcon: SafeResourceUrl, splitTime: string, subsplitTime: string, runTime: string}[] {
    return this.pbMap;
  }

  public setDataIndex(conf: {gameIcon: number, gameName: number, categoryName: number, layoutPath: number, metadata: number, offset: number, attemptCount: number, attemptHistory: number, segments: number, autoSplitterSettings: number}) {
    this.lsDataIndex = conf
  }

  public getDataIndex() {
    return this.lsDataIndex
  }

  nowDisp(message: boolean) {
    this.dispDivs.next(message);
  }

}
