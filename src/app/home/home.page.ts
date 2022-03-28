import { Component, OnInit } from "@angular/core";
import { Device } from "@ionic-enterprise/identity-vault";
import { VaultService, VaultServiceState } from "../vault.service";

@Component({
  selector: "app-home",
  templateUrl: "home.page.html",
  styleUrls: ["home.page.scss"],
})
export class HomePage implements OnInit {
  public state: VaultServiceState;

  _isBiometricsEnabled = false;

  constructor(private vaultService: VaultService) {
    this.state = vaultService.state;
  }

  async ngOnInit() {
    await this.isBiometricsEnabled();
  }

  async isBiometricsEnabled(): Promise<void> {
    const enabled = await Device.isBiometricsEnabled();
    this._isBiometricsEnabled = enabled;
  }

  async setSession(data: string) {
    await this.vaultService.setSession(data);
  }

  async restoreSession() {
    await this.vaultService.restoreSession();
  }

  lockVault() {
    this.vaultService.lockVault();
  }

  unlockVault() {
    this.vaultService.unlockVault();
  }

  setLockType() {
    this.vaultService.setLockType();
  }

  setPrivacyScreen() {
    this.vaultService.setPrivacyScreen(this.state.privacyScreen);
  }

  clearVault() {
    this.vaultService.clearVault();
  }
}

const x = () => {};
