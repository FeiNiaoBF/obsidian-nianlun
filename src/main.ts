import { Plugin } from 'obsidian';
import { DEFAULT_SETTINGS, NianLunSettings, NianLunSettingTab } from "./settings";
import { NianLunProcessor } from "./nianlun-processor";

export default class NianLunPlugin extends Plugin {
	settings: NianLunSettings;

	async onload() {
		await this.loadSettings();

		// Register the custom Markdown Code Block Processor
		this.registerMarkdownCodeBlockProcessor("nianlun", NianLunProcessor.process.bind(NianLunProcessor));

		// Register settings tab
		this.addSettingTab(new NianLunSettingTab(this.app, this));
	}

	onunload() {
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<NianLunSettings>);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
