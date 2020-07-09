import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SwUpdate } from '@angular/service-worker';
import "@alan-ai/alan-button";

import { AlertController, MenuController, Platform, ToastController, NavController } from '@ionic/angular';

import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';

import { Storage } from '@ionic/storage';

import { UserData } from './providers/user-data';
import { ConferenceData } from './providers/conference-data'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  appPages = [
    {
      title: 'Schedule',
      url: '/app/tabs/schedule',
      icon: 'calendar'
    },
    {
      title: 'Speakers',
      url: '/app/tabs/speakers',
      icon: 'people'
    },
    {
      title: 'Map',
      url: '/app/tabs/map',
      icon: 'map'
    },
    {
      title: 'About',
      url: '/app/tabs/about',
      icon: 'information-circle'
    }
  ];
  loggedIn = false;
  dark = false;
  @ViewChild('alanBtnEl', {static:false}) alanBtnComponent: ElementRef<HTMLAlanButtonElement>;

  constructor(
    private alertCtrl: AlertController,
    private menu: MenuController,
    private platform: Platform,
    private router: Router,
    private splashScreen: SplashScreen,
    private statusBar: StatusBar,
    private storage: Storage,
    private user: UserData,
    private userData: UserData,
    private swUpdate: SwUpdate,
    private toastCtrl: ToastController,
    private confData: ConferenceData,
    private navCtrl: NavController
  ) {
    this.initializeApp();
  }

  async ngOnInit() {
    this.checkLoginStatus();
    this.listenForLoginEvents();

    this.swUpdate.available.subscribe(async res => {
      const toast = await this.toastCtrl.create({
        message: 'Update available!',
        position: 'bottom',
        buttons: [
          {
            role: 'cancel',
            text: 'Reload'
          }
        ]
      });

      await toast.present();

      toast
        .onDidDismiss()
        .then(() => this.swUpdate.activateUpdate())
        .then(() => window.location.reload());
    });

  }
  async addFavorite(sessionData: any) {
    this.user.addFavorite(sessionData.name);
    this.alanBtnComponent.nativeElement.setVisualState({favName: sessionData.name});
    // Create a toast
      const toast = await this.toastCtrl.create({
        header: `${sessionData.name} was successfully added as a favorite.`,
        duration: 3000,
        buttons: [{
          text: 'Close',
          role: 'cancel'
        }]
      });

      // Present the toast at the bottom of the page
      await toast.present();
    }



  async removeFavorite(sessionData: any) {
    this.user.removeFavorite(sessionData.name);
    this.alanBtnComponent.nativeElement.setVisualState({removeFavName: sessionData.name});
    const toast = await this.toastCtrl.create({
      header: `${sessionData.name} was successfully added as a favorite.`,
      duration: 3000,
      buttons: [{
        text: 'Close',
        role: 'cancel'
      }]
    });
    // now present the alert on top of all other content
    await toast.present();
  }

  ngAfterViewInit() {
    this.alanBtnComponent.nativeElement.addEventListener('command', (data) => {
        const commandData = (<CustomEvent>data).detail;

        if (commandData.command === 'navigation') {
            //call client code that will react to the received command
            this.navCtrl.navigateForward([commandData.route]);
        }

        if(commandData.command === 'scheduleNavigation'){
          this.navCtrl.navigateForward([commandData.agendaRoute]);
        }

      let agendaIndex;
        if(commandData.command === 'readAgenda'){
          console.log(commandData.id);
          for(let i in this.confData.data.schedule[0].groups){
              agendaIndex = this.confData.data.schedule[0].groups[i].sessions.findIndex(x => x.id === `${commandData.id}`);
              console.log(agendaIndex);
              if(agendaIndex > -1){
                this.alanBtnComponent.nativeElement.setVisualState({agenda: this.confData.data.schedule[0].groups[i].sessions[agendaIndex]});
                break;
              }
          }
          if(agendaIndex < 0){
            this.alanBtnComponent.nativeElement.setVisualState({agenda: ''});
          }
        }

        let favIndex;
        if(commandData.command === 'addFavorite'){
          for(let i in this.confData.data.schedule[0].groups){
              favIndex = this.confData.data.schedule[0].groups[i].sessions.findIndex(x => x.id === `${commandData.id}`);
              console.log(favIndex);
              if(favIndex > -1){
                this.addFavorite(this.confData.data.schedule[0].groups[i].sessions[favIndex]);
                break;
              }
          }
          if(favIndex < 0){
            this.alanBtnComponent.nativeElement.setVisualState({favName: ''});
          }
        }

        let removeFavIndex;
        if(commandData.command === 'removeFavorite'){
          for(let i in this.confData.data.schedule[0].groups){
            removeFavIndex = this.confData.data.schedule[0].groups[i].sessions.findIndex(x => x.id === `${commandData.removeID}`);
              console.log(removeFavIndex);
              if(removeFavIndex > -1){
                this.removeFavorite(this.confData.data.schedule[0].groups[i].sessions[removeFavIndex]);
                break;
              }
          }
          
        }

        let timeIndex;
        if(commandData.command === 'specifyAgenda'){
          for(let i in this.confData.data.schedule[0].groups){
            timeIndex = this.confData.data.schedule[0].groups[i].sessions.findIndex(x => x.timeStart.substring(0,4) === `${commandData.time.substring(0,4)}`);
              if(timeIndex != -1){
                console.log(timeIndex);
                this.alanBtnComponent.nativeElement.setVisualState({agendaObject: this.confData.data.schedule[0].groups[i].sessions[timeIndex]});
                break;
              }
          }
          if(timeIndex < 0){
            this.alanBtnComponent.nativeElement.setVisualState({agendaObject: ''});
          }
        }

        let animalIndex;
        if(commandData.command === 'aboutAnimal'){
            animalIndex = this.confData.data.speakers.findIndex(x => x.name.toLowerCase() === `${commandData.animal.toLowerCase()}`);
              if(animalIndex > -1){
                this.alanBtnComponent.nativeElement.setVisualState({animalInfo: this.confData.data.speakers[animalIndex]});
          }
        }
    });
}
  initializeApp() {
    this.platform.ready().then(() => {
      this.statusBar.styleDefault();
      this.splashScreen.hide();
    });
  }

  checkLoginStatus() {
    return this.userData.isLoggedIn().then(loggedIn => {
      return this.updateLoggedInStatus(loggedIn);
    });
  }

  updateLoggedInStatus(loggedIn: boolean) {
    setTimeout(() => {
      this.loggedIn = loggedIn;
    }, 300);
  }

  listenForLoginEvents() {
    window.addEventListener('user:login', () => {
      this.updateLoggedInStatus(true);
    });

    window.addEventListener('user:signup', () => {
      this.updateLoggedInStatus(true);
    });

    window.addEventListener('user:logout', () => {
      this.updateLoggedInStatus(false);
    });
  }

  logout() {
    this.userData.logout().then(() => {
      return this.router.navigateByUrl('/app/tabs/schedule');
    });
  }

  openTutorial() {
    this.menu.enable(false);
    this.storage.set('ion_did_tutorial', false);
    this.router.navigateByUrl('/tutorial');
  }
}
