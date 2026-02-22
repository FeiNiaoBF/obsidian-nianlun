import {App, PluginSettingTab, Setting} from "obsidian";
import NianLunPlugin from "./main";

export interface NianLunSettings {
	mySetting: string;
}

export const DEFAULT_SETTINGS: NianLunSettings = {
	mySetting: 'default'
}

export class NianLunSettingTab extends PluginSettingTab {
	plugin: NianLunPlugin;

	constructor(app: App, plugin: NianLunPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Theme settings')
			.setDesc('Advanced settings will be added here.')
			.addText(text => text
				.setPlaceholder('Enter your config')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}
