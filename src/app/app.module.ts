import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LsUploadComponent } from './ls-upload/ls-upload.component';
import { HttpClientModule} from '@angular/common/http';
import { LsStatisticsComponent } from './ls-data/ls-statistics.component';
import { MonacoEditorModule, MONACO_PATH } from '@materia-ui/ngx-monaco-editor';
import { FormsModule } from '@angular/forms';
import { LsTrueBalancedComponent } from './ls-true-balanced/ls-true-balanced.component';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ChartsModule } from 'ng2-charts';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { PersonalBestComponent } from './tabs/personal-best/personal-best.component';
import { GeneralInfoComponent } from './tabs/general-info/general-info.component';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA1w2Hyqk9rS5nNRqYagR-qD9aO3tHr0x8",
  authDomain: "livesplitwebapp.firebaseapp.com",
  projectId: "livesplitwebapp",
  storageBucket: "livesplitwebapp.appspot.com",
  messagingSenderId: "1057015961588",
  appId: "1:1057015961588:web:2cb705a9e013b414188ba1",
  measurementId: "G-EJ7JZY4VMB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);


@NgModule({
  declarations: [
    AppComponent,
    LsUploadComponent,
    LsStatisticsComponent,
    LsTrueBalancedComponent,
    PersonalBestComponent,
    GeneralInfoComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    MonacoEditorModule,
    FormsModule,
    ChartsModule,
    MatTabsModule,
    MatCheckboxModule,
    MatTooltipModule,
    BrowserAnimationsModule
  ],
  providers: [
    {
      provide: MONACO_PATH,
      useValue: 'https://unpkg.com/monaco-editor@0.24.0/min/vs'
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {

 }
