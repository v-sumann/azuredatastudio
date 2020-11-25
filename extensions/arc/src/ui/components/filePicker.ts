/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as azdata from 'azdata';
import * as path from 'path';
import * as vscode from 'vscode';
import * as loc from '../../localizedConstants';
import { IReadOnly } from '../dialogs/connectControllerDialog';

export interface RadioOptionsInfo {
	values?: string[],
	defaultValue: string
}

export class FilePicker implements IReadOnly {
	private _flexContainer: azdata.FlexContainer;
	private _filePathInputBox: azdata.InputBoxComponent;
	private _filePickerButton: azdata.ButtonComponent;
	constructor(
		modelBuilder: azdata.ModelBuilder,
		initialPath: string, onNewDisposableCreated: (disposable: vscode.Disposable) => void
	) {
		const buttonWidth = 80;
		this._filePathInputBox = modelBuilder.inputBox()
			.withProperties<azdata.InputBoxProperties>({
				value: initialPath,
				width: 350
			}).component();

		this._filePickerButton = modelBuilder.button()
			.withProperties<azdata.ButtonProperties>({
				label: loc.browse,
				width: buttonWidth
			}).component();
		onNewDisposableCreated(this._filePickerButton.onDidClick(async () => {
			const fileUris = await vscode.window.showOpenDialog({
				canSelectFiles: true,
				canSelectFolders: false,
				canSelectMany: false,
				defaultUri: this._filePathInputBox.value ? vscode.Uri.file(path.dirname(this._filePathInputBox.value)) : undefined,
				openLabel: loc.select,
				filters: undefined /* file type filters */
			});

			if (!fileUris || fileUris.length === 0) {
				return; // TODO: Should we throw here. It is unclear whey showOpenDialog above will return undefined or an empty array
			}
			const fileUri = fileUris[0]; //we allow the user to select only one file in the dialog
			this._filePathInputBox.value = fileUri.fsPath;
		}));
		this._flexContainer = createFlexContainer(modelBuilder, [this._filePathInputBox, this._filePickerButton]);
	}

	component(): azdata.Component {
		return this._flexContainer;
	}

	get onTextChanged() {
		return this._filePathInputBox.onTextChanged;
	}

	get value(): string | undefined {
		return this._filePathInputBox?.value;
	}

	get readOnly(): boolean {
		return this.enabled;
	}

	set readOnly(value: boolean) {
		this.enabled = value;
	}

	get enabled(): boolean {
		return !!this._flexContainer.enabled && this._flexContainer.items.every(r => r.enabled);
	}

	set enabled(value: boolean) {
		this._flexContainer.items.forEach(r => r.enabled = value);
		this._flexContainer.enabled = value;
	}
}

function createFlexContainer(modelBuilder: azdata.ModelBuilder, items: azdata.Component[], rowLayout: boolean = true, width?: string | number, height?: string | number, alignItems?: azdata.AlignItemsType, cssStyles?: { [key: string]: string }): azdata.FlexContainer {
	const flexFlow = rowLayout ? 'row' : 'column';
	alignItems = alignItems || (rowLayout ? 'center' : undefined);
	const itemsStyle = rowLayout ? { CSSStyles: { 'margin-right': '5px', } } : {};
	const flexLayout: azdata.FlexLayout = { flexFlow: flexFlow };
	if (height) {
		flexLayout.height = height;
	}
	if (width) {
		flexLayout.width = width;
	}
	if (alignItems) {
		flexLayout.alignItems = alignItems;
	}
	return modelBuilder.flexContainer().withItems(items, itemsStyle).withLayout(flexLayout).withProperties<azdata.ComponentProperties>({ CSSStyles: cssStyles || {} }).component();
}