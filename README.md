# Getting Started with Identity Vault in @ionic/angular

In this tutorial we will walk through the basic setup and use of Ionic's Identity Vault in an `@ionic/angular` application.

:::note
The source code for the Ionic application created in this tutorial can be found [here](https://github.com/ionic-team/getting-started-iv-angular)
:::

The most common use case of Identity Vault is to connect to a back end service and store user session data. For the purpose of this tutorial, the application we build will not connect to an actual service. Instead, the application will store information that the user enters.

The work done in this tutorial will be concentrated on a couple of files:

- `src/app/vault.service.ts`: An Angular service that abstracts the logic associated with using Identity Vault. Methods and properties here model what might be done in a real application.

- `src/app/home/home.page.ts`: The main view will have several form controls that allow the user to manipulate the vault. An application would not typically do this. Rather, it would call the methods from `vault-service.ts` within various workflows. In this "getting started" demo application, however, this allows us to easily play around with the various APIs to see how they behave.

## Generate the Application

The first step to take is to generate our application:

```bash
ionic start getting-started-iv-angular blank --type=angular-standalone --capacitor
```

Now that the application has been generated let's add the iOS and Android platforms.

Open the `capacitor.config.ts` file and change the `appId` to something unique like `io.ionic.gettingstartedivangular`:

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.gettingstartedivangular',
  appName: 'getting-started-iv-angular',
  webDir: 'www',
  bundledWebRuntime: false,
};

export default config;
```

Next, build the application and install and create the platforms:

```bash
npm run build
ionic cap add android
ionic cap add ios
```

Finally, in order to ensure that the web application bundle is copied over each build, add `cap copy` to the `build` script in the `package.json` file:

```json
"scripts": {
  "build": "ng build && cap copy",
  ...
},
```

## Install Identity Vault

In order to install Identity Vault you will need to use `ionic enterprise register` to register your product key. This will create a `.npmrc` file containing the product key.

If you have already performed that step for your production application, you can just copy the `.npmrc` file from your production project. Since this application is for learning purposes only, you don't need to obtain another key.

You can now install Identity Vault. If you are using Cordova then run:

```bash
ionic cordova plugin add @ionic-enterprise/identity-vault
```

If you are using Capacitor then:

```bash
npm install @ionic-enterprise/identity-vault
npx cap sync
```

## Create the Vault

In this step, we will create the vault and test it by storing and retrieving a value from it. This value will be called `session`, since storing session data in a vault is the most common use case of Identity Vault. However, it is certainly not the _only_ use case.

First, use the Ionic CLI to generate a service file named `src/app/vault.service.ts`:

```bash
ionic generate service vault
```

Within this file we will create an Angular service that defines the vault and methods that abstract all of the logic we need in order to interact with the vault:

```typescript
import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import {
  Vault,
  Device,
  DeviceSecurityType,
  VaultType,
  BrowserVault,
  IdentityVaultConfig,
} from '@ionic-enterprise/identity-vault';
import { Platform } from '@ionic/angular';

const config: IdentityVaultConfig = {
  key: 'io.ionic.getstartedivangular',
  type: VaultType.SecureStorage,
  deviceSecurityType: DeviceSecurityType.None,
  lockAfterBackgrounded: 2000,
  shouldClearVaultAfterTooManyFailedAttempts: true,
  customPasscodeInvalidUnlockAttempts: 2,
  unlockVaultOnLoad: false,
};
const key = 'sessionData';

export interface VaultServiceState {
  session: string;
}

@Injectable({ providedIn: 'root' })
export class VaultService {
  public state: VaultServiceState = {
    session: '',
  };

  vault: Vault | BrowserVault;

  constructor(private platform: Platform) {
    this.vault = Capacitor.getPlatform() === 'web' ? new BrowserVault(config) : new Vault(config);
  }

  async init() {
    await this.platform.ready(); // This is required only for Cordova
  }

  async setSession(value: string): Promise<void> {
    this.state.session = value;
    await this.vault.setValue(key, value);
  }

  async restoreSession() {
    const value = await this.vault.getValue(key);
    this.state.session = value;
  }
}
```

:::note
Constructors must be synchronous and should only contain construction related code. As such, we also have an `init()` method that will be used to initialize the vault. This ensures that our vault is contructed properly and is ready for injection, while also allowing for asynchronous initialization.
:::

Let's look at this file section by section:

The first thing we do is define a configuration for our vault. The `key` gives the vault a name. The other properties provide a default behavior for our vault. As we shall see later, the configuration can be changed as we use the vault.

```typescript
const config: IdentityVaultConfig = {
  key: 'io.ionic.getstartedivangular',
  type: VaultType.SecureStorage,
  deviceSecurityType: DeviceSecurityType.None,
  lockAfterBackgrounded: 2000,
  shouldClearVaultAfterTooManyFailedAttempts: true,
  customPasscodeInvalidUnlockAttempts: 2,
  unlockVaultOnLoad: false,
};
```

Next, we define a key for storing data. All data within the vault is stored as a key-value pair and you can store multiple key-value pairs within a single vault.

```typescript
const key = 'sessionData';
```

Then, we create an Angular service that creates our vault.

```typescript
@Injectable({ providedIn: 'root' })
export class VaultService {
  public state: VaultServiceState = {
    session: '',
  };

  vault: Vault | BrowserVault;

  constructor(private platform: Platform) {
    this.vault = Capacitor.getPlatform() === 'web' ? new BrowserVault(config) : new Vault(config);
  }

  async init() {
    await this.platform.ready(); // This is required only for Cordova
  }

  async setSession(value: string): Promise<void> {
    this.state.session = value;
    await this.vault.setValue(key, value);
  }

  async restoreSession() {
    const value = await this.vault.getValue(key);
    this.state.session = value;
  }
}
```

The service additionally contains a state property that will be used to reflect the current `session` data to the outside world. It also contains methods that are used to store and restore our session.

:::note
It's recommended to abstract vault functionality into functions that define how the rest of the application should interact with the vault instead of directly returning the `vault` instance. This creates more maintainable and debuggable code, while preventing the rest of the code from being exposed to potential API changes and reduces the chance of duplicating code.
:::

Note that we are using the `BrowserVault` class when the application is running on the web. The `BrowserVault` allows us to continue to use our normal web-based development workflow.

```typescript
this.vault = Capacitor.getPlatform() === 'web' ? new BrowserVault(config) : new Vault(config);
```

:::note
The `BrowserVault` class allows developers to use their normal web-based development workflow. It does **not** provide locking or security functionality.
:::

We need to initialize the `VaultService`. We will do that in `src/main.ts` via Angular's `APP_INITIALIZER` depencency injection token:

```typescript
import { APP_INITIALIZER, enableProdMode, importProvidersFrom } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter } from '@angular/router';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';
import { VaultService } from './app/vault.service';

const appInitFactory =
  (vaultService: VaultService): (() => Promise<void>) =>
  () =>
    vaultService.init();

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    {
      provide: APP_INITIALIZER,
      useFactory: appInitFactory,
      deps: [VaultService],
      multi: true,
    },
    importProvidersFrom(IonicModule.forRoot({})),
    provideRouter(routes),
  ],
});
```

Now that we have the vault in place and properly initialized, let's switch over to `src/home/home.page.html` and implement some simple interactions with the vault. Here is a snapshot of what we will change:

Update the template to match the following code:

```html
<ion-header [translucent]="true">
  <ion-toolbar>
    <ion-title> Blank </ion-title>
  </ion-toolbar>
</ion-header>

<ion-content [fullscreen]="true">
  <ion-header collapse="condense">
    <ion-toolbar>
      <ion-title size="large">Blank</ion-title>
    </ion-toolbar>
  </ion-header>

  <ion-list>
    <ion-item>
      <ion-input
        label="Enter the &ldquo;session&rdquo; data"
        label-placement="floating"
        [(ngModel)]="state.session"
      ></ion-input>
    </ion-item>

    <ion-item>
      <div style="flex: auto">
        <ion-button expand="block" (click)="setSession(state.session)"> Set Session Data </ion-button>
      </div>
    </ion-item>

    <ion-item>
      <div style="flex: auto">
        <ion-button expand="block" (click)="restoreSession()"> Restore Session Data </ion-button>
      </div>
    </ion-item>

    <ion-item>
      <ion-label>
        <div>Session Data: {{ state.session }}</div>
      </ion-label>
    </ion-item>
  </ion-list>
</ion-content>
```

Update `src/app/home/home.page.ts` to match the following code:

```typescript
import { Component } from '@angular/core';
import { VaultService, VaultServiceState } from '../vault.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
})
export class HomePage {
  public state: VaultServiceState;

  constructor(private vaultService: VaultService) {
    this.state = vaultService.state;
  }

  async setSession(data: string) {
    await this.vaultService.setSession(data);
  }

  async restoreSession() {
    await this.vaultService.restoreSession();
  }
}
```

:::note
Throughout the rest of this tutorial only new markup or required code will be provided. It is up to you to make sure that the correct imports and component definitions are added.
:::

Build the application and run it on an iOS and/or Android device. You should be able to enter some data and store it in the vault by clicking "Set Session Data." If you then shutdown the app and start it again, you should be able to restore it using "Restore Session Data."

## Locking and Unlocking the Vault

Now that we are storing data in the vault, it would be helpful to lock and unlock that data. The vault will automatically lock after `lockAfterBackgrounded` milliseconds of the application being in the background. We can also lock the vault manually if we so desire.

Add the following methods to `VaultService`:

```typescript
async lockVault() {
  await this.vault.lock();
}

async unlockVault() {
  await this.vault.unlock();
}
```

We can then add a couple of buttons to our `HomePage` component:

```html
<ion-item>
  <div style="flex: auto">
    <ion-button expand="block" (click)="lockVault()">Lock Vault</ion-button>
  </div>
</ion-item>

<ion-item>
  <div style="flex: auto">
    <ion-button expand="block" (click)="unlockVault()">Unlock Vault</ion-button>
  </div>
</ion-item>
```

```typescript
lockVault() {
  this.vaultService.lockVault();
}

unlockVault() {
  this.vaultService.unlockVault();
}
```

We can now lock and unlock the vault, though in our current state we cannot really tell. Our application should react in some way when the vault is locked. For example, we may want to clear specific data from memory. We may also wish to redirect to a page that will only allow the user to proceed if they unlock the vault.

In our case, we will just clear the `session` and have a flag that we can use to visually indicate if the vault is locked or not. We can do that by using the vault's `onLock` event.

First, we need to add a state variable to track whether the vault is locked or not. Add the following code to `src/vault.service.ts`:

```typescript
import { Injectable, NgZone } from '@angular/core';
...
export class VaultService {
  public state: VaultServiceState = {
    session: "",
    isLocked: false
  };
  ...
  constructor(private ngZone: NgZone, private platform: Platform) {
    this.vault = Capacitor.getPlatform() === "web" ? new BrowserVault(config) : new Vault(config);
  }

  async init() {
    await this.platform.ready(); // This is required only for Cordova

    this.vault.onLock(() => {
      this.ngZone.run(() => {
        this.state.isLocked = true;
        this.state.session = undefined;
      });
    });

    this.vault.onUnlock(() => {
      this.ngZone.run(() => {
        this.state.isLocked = false;
      });
    });
  }
}
```

:::note
Events fired by Identity Vault are unaware of Angular's change detection system. Utilize `ngZone` to ensure user interface updates are made on changes.
:::

Then, update `home.page.html` to display the `vaultIsLocked` value along with the session:

```html
<ion-item>
  <ion-label>
    <div>Session Data: {{ state.session }}</div>
    <div>Vault is locked: {{ state.isLocked }}</div>
  </ion-label>
</ion-item>
```

Build and run the application. When the user presses the "Lock Vault" button, the "Session Data" will be cleared out. Pressing "Unlock Vault" will cause "Vault is Locked" to show as false again. Pressing "Restore Session Data" will both unlock a vault and get the session data back.

In its current state, the vault is set to the `SecureStorage` vault type. We will be unable to observe any changes to the "Vault is Locked" value until we update the vault's configuration to a different vault type.

:::note
Vaults set to the `SecureStorage` vault type _do not_ lock. Data stored within this type of vault are still encrypted at rest and can be restored between sessions.
:::

In a few sections we will explore different vault types further, allowing us to test the ability to lock and unlock a vault. First, we will begin exploring the `Device` API.

## Device Level Capabilities

Identity Vault allows you to have multiple vaults within your application. However, there are some capabilities that Identity Vault allows you to control that are applicable to the device that the application is running on rather than being applicable to any given vault. For these items, we will use Identity Vault's `Device` API.

One such item is the "privacy screen." When an application is put into the background, the default behavior is for the OS to take a screenshot of the current page and display that as the user scrolls through the open applications. However, if your application displays sensitive information you may not want that information displayed at such a time. So, another option is to display the splash screen (on iOS) or a plain rectangle (on Android) instead of the screenshot. This is often referred to as a "privacy screen."

We will use the `Device.isHideScreenOnBackgroundEnabled()` method to determine if our application will currently display the privacy screen or not. Then we will use the `Device.setHideScreenOnBackground()` method to control whether it is displayed or not. Finally, we will hook that all up to a checkbox in the UI to allow the user to manipulate the value at run time.

We only want to interact with the Device API if we are actually running on a device, so we will also use Ionic's platform detection features to avoid using the Device API when running on the web. Our app is not targeting the web; we just want to ensure we can still use a web based development flow.

All of the following code applies to the `src/app/vault.service.ts` file.

First, import the `Device` API:

```typescript
import { Device } from '@ionic-enterprise/identity-vault';
```

Next, add a property to track if the privacy screen is enabled:

```typescript
export interface VaultServiceState {
  ...
  privacyScreen: boolean;
}

@Injectable({providedIn: "root"})
export class VaultService {
  public state: VaultServiceState = {
    ...
    privacyScreen: false
  };
  ...
}
```

Then, we will add logic to handle the privacy screen within `VaultService`:

```typescript
@Injectable({providedIn: "root"})
export class VaultService {
  ...
  async init() {
    ...
    this.state.privacyScreen =
      Capacitor.getPlatform() === "web"
        ? false
        : await Device.isHideScreenOnBackgroundEnabled();
  }
  ...
  setPrivacyScreen(enabled: boolean) {
    Device.setHideScreenOnBackground(enabled);
    this.state.privacyScreen = enabled;
  }
}
```

Finally, we can add the checkbox to the `HomePage` component:

```html
<ion-item>
  <ion-checkbox [(ngModel)]="state.privacyScreen" (ionChange)="setPrivacyScreen()">Use Privacy Screen</ion-checkbox>
</ion-item>
```

```typescript
setPrivacyScreen() {
  this.vaultService.setPrivacyScreen(this.state.privacyScreen);
}
```

Build the app and play around with changing the checkbox and putting the app in the background. In most applications, you would leave this value set by default. If you were going to change it, you would most likely do so on startup and leave it that way.

## Using Different Vault Types

The mechanism used to unlock a vault is determined by a combination of the `type` and the `deviceSecurityType` configuration settings.

The `type` setting can be set to any value from the `VaultType` enumeration:

- `SecureStorage`: Securely store the data in the keychain, but do not lock it.
- `DeviceSecurity`: When the vault is locked, it needs to be unlocked by a mechanism provided by the device.
- `CustomPasscode`: When the vault is locked, it needs to be unlocked via a custom method provided by the application. This is typically done in the form of a custom PIN dialog.
- `InMemory`: The data is never persisted. As a result, if the application is locked or restarted the data is gone.

If `VaultType.DeviceSecurity` is used, the optional `deviceSecurityType` setting can further refine the vault by assigning a value from the `DeviceSecurity` enumeration:

- `Biometrics`: Use the biometric authentication type specified by the device.
- `SystemPasscode`: Use the system passcode entry screen.
- `Both`: Use `Biometrics` with the `SystemPasscode` as a backup when `Biometrics` fails.

We specified `SecureStorage` when we set up the vault:

```typescript
const config: IdentityVaultConfig = {
  key: 'io.ionic.getstartedivangular',
  type: VaultType.SecureStorage,
  deviceSecurityType: DeviceSecurityType.None,
  lockAfterBackgrounded: 2000,
  shouldClearVaultAfterTooManyFailedAttempts: true,
  customPasscodeInvalidUnlockAttempts: 2,
  unlockVaultOnLoad: false,
};
```

However, we can use the vault's `updateConfig()` method to change this at run time.

In our application, we don't want to use every possible combination. Rather than exposing the raw `type` and `deviceSecurityType` values to the rest of the application, let's define the types of authorization we _do_ want to support:

- `NoLocking`: We want to store the session data securely, but never lock it.
- `Biometrics`: We want to use the device's biometric mechanism to unlock the vault when it is locked.
- `SystemPasscode`: We want to use the device's passcode screen (typically a PIN or pattern) to unlock the vault when it is locked.

Now we have the types defined within the domain of our application. The only code within our application that will have to worry about what this means within the context of the Identity Vault configuration is `src/vault.service.ts`.

First, add another property to `VaultServiceState`:

```typescript
export interface VaultServiceState {
  ...
  lockType: "NoLocking" | "Biometrics" | "SystemPasscode";
}
```

Next, set the initial state within the `VaultService` itself:

```typescript
public state: VaultServiceState = {
  lockType: 'NoLocking'
};
```

Then, define a method to allow users to change `lockType` and update the vault configuration accordingly:

```typescript
async setLockType() {
  let type: VaultType;
  let deviceSecurityType: DeviceSecurityType;

  switch (this.state.lockType) {
    case 'Biometrics':
      type = 'DeviceSecurity';
      deviceSecurityType = 'Biometrics';
      break;

    case 'SystemPasscode':
      type = 'DeviceSecurity';
      deviceSecurityType = 'SystemPasscode';
      break;

    default:
      type = 'SecureStorage';
      deviceSecurityType = 'SystemPasscode';
  }
  await this.vault.updateConfig({ ...this.vault.config, type, deviceSecurityType });
}
```

Finally, add a group of radio buttons to the `HomePage` component that control the type of vault being used. Remember to import any new components being used:

```html
<ion-item>
  <ion-radio-group [(ngModel)]="state.lockType" (ionChange)="setLockType()">
    <ion-list-header>
      <ion-label> Vault Locking Mechanism </ion-label>
    </ion-list-header>

    <ion-item>
      <ion-radio value="NoLocking">Do Not Lock</ion-radio>
    </ion-item>

    <ion-item>
      <ion-radio [disabled]="!state.canUseBiometrics" value="Biometrics">Use Biometrics</ion-radio>
    </ion-item>

    <ion-item>
      <ion-radio [disabled]="!state.canUsePasscode" value="SystemPasscode">Use System Passcode</ion-radio>
    </ion-item>
  </ion-radio-group>
</ion-item>
```

```typescript
setLockType() {
  this.vaultService.setLockType();
}
```

The "Use Biometrics" and "Use System Passcode" radio buttons will be disabled on whether or not the feature has been enabled on the device. We will need to code for that by adding properties to `VaultServiceState` and updating `VaultService`:

```typescript
export interface VaultServiceState {
  ...
  canUseBiometrics: boolean;
  canUsePasscode: boolean;
}

@Injectable({ providedIn: "root" })
export class VaultService {
  public state: VaultServiceState = {
    ...
    canUseBiometrics: false,
    canUsePasscode: false,
  };

  async init() {
    ...
    this.state.canUseBiometrics =
      Capacitor.getPlatform() === "web"
        ? false
        : await Device.isBiometricsEnabled();
    this.state.canUsePasscode =
      Capacitor.getPlatform() === "web"
        ? false
        : await Device.isSystemPasscodeSet();
  }
}
```

Notice that we are using the `Device` API again to determine if biometrics is both: (a) supported by the current device, and (b) enabled by the device user. Users should not be able to choose that option unless biometrics are properly set up on the device.

One final bit of housekeeping before building and running the application: if you are using an iOS device you need to open the `Info.plist` file and add the `NSFaceIDUsageDescription` key with a value like "Use Face ID to unlock the vault when it is locked."

Now when you run the app, you can choose a different locking mechanism and it should be used whenever you need to unlock the vault.

If you change the vault type to use either Biometrics or Session Passcode, you should see that the vault is still using that mode when you restart the application. If a vault already exists for a given key (such as `'io.ionic.getstartedivangular'`), the vault remembers which mode it is operating in and will ignore the mode passed into the constructor.

## Current Lock Status

Now that the vault type can be set to modes that lock, the "Lock Vault" and "Unlock Vault" buttons are now testable. However, try the following set of instructions:

1. Set some session data.
2. Press either the "Use Biometrics" or "Use System Passcode" radio buttons.
3. Close the application.
4. Restart the application.
5. Observe that "Vault is Locked" is shown as `false`.
6. Press the "Restore Session Data" button.
7. Observe the application request a security prompt.

Our flag is wrong because it's value is set to `false` on startup, and the `onLock` event does not trigger on startup. The `Vault` API provides a way to programmatically obtain the current lock status of the vault.

Add the following line of code to `src/vault.service.ts` immediately after the `onUnlock` event handler:

```typescript
this.state.isLocked = await this.vault.isLocked();
```

Now when the application is restarted, the vault should be shown as locked.

## Clear the Vault

In this final step, we will remove all items from the vault and then remove the vault itself. This can be achieved through the `Vault` API by calling the `clear()` method.

To show this in action, add a `isEmpty` property to the `VaultServiceState` in `src/vault.service.ts`:

```typescript
export interface VaultServiceState {
  ...
  isEmpty: boolean;
}
```

Next, add a function named `clearVault()` within `VaultService`. This function will call `vault.clear()`, set the `lockType` to `NoLocking`, and clear out `session` state property:

```typescript
async clearVault() {
  await this.vault.clear();
  this.state.lockType = "NoLocking";
  this.state.session = undefined;
  this.state.isEmpty = await this.vault.isEmpty();
}
```

In order to see when a vault does or does not exist, let's add the following code to `clearVault()` and `setSession()`:

```typescript
this.state.isEmpty = await this.vault.isEmpty();
```

We should also add a call within the `init()` method to initialize the value along with the vault. Go ahead and do so.

Once that all is in place, make the following adjustments to the `HomePage` component:

- Create a method that calls `VaultService.clearVault()`.
- Add a button to clear the vault by calling the method created above on click.
- Display the current value of `isEmpty` in a `div` the same way `session` and `vaultIsLocked` are being shown.

## Conclusion

This "getting started" tutorial has implemented using Identity Vault in a very manual manner, allowing for a lot of user interaction with the vault. In an actual application, a lot of this functionality would instead be a part of several programmatic workflows within the application.

At this point, you should have a good idea of how Identity Vault works. There is still more functionality that can be implemented. Be sure to check out our documentation to determine how to facilitate specific areas of functionality within your application.
