/**
 * Copyright (c) Cisco Systems, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import "@momentum-ui/web-components";
import "@cjaas/common-components";
import { customElement, html, internalProperty, LitElement } from "lit-element";
import styles from "./sandbox.scss";
import "..";

@customElement("cjaas-component-sandbox")
export class Sandbox extends LitElement {
  @internalProperty() darkTheme = false;
  @internalProperty() containerWidth = "600px";
  @internalProperty() containerHeight = "80vh";
  @internalProperty() selectedComponent = "Activity Item";
  static get styles() {
    return styles;
  }

  themeToggle() {
    return html`
      <div class="toggle-container">
        <md-checkbox
          type="checkbox"
          id="theme-switch"
          class="theme-switch"
          data-aspect="darkTheme"
          label="Dark Mode"
          @checkbox-change=${(e: MouseEvent) => this.toggleSetting(e)}
          ?checked=${this.darkTheme}
          >Dark Mode</md-checkbox
        >
        <div class="switch-container">
          <md-label class="switch" text="Responsive">
            Widget Boundary
          </md-label>
          <md-input
            type="text"
            id="width-switch"
            class="theme-switch"
            data-aspect="responsive-width"
            @click=${(e: MouseEvent) => this.toggleSetting(e)}
            @input-change=${(e: MouseEvent) => this.toggleSetting(e)}
            value=${this.containerWidth}
          ></md-input>
          <md-label>x</md-label>
          <md-input
            type="text"
            id="height-switch"
            class="theme-switch"
            data-aspect="responsive-height"
            @click=${(e: MouseEvent) => this.toggleSetting(e)}
            @input-change=${(e: MouseEvent) => this.toggleSetting(e)}
            value=${this.containerHeight}
          ></md-input>
        </div>
      </div>
    `;
  }

  toggleSetting(e: MouseEvent) {
    const composedPath = e.composedPath();
    const target = (composedPath[0] as unknown) as HTMLInputElement;
    const aspect: string = target.dataset.aspect!;
    if (aspect === "responsive-width") {
      this.containerWidth = target.value;
    } else if (aspect === "responsive-height") {
      this.containerHeight = target.value;
    } else if (aspect === "darkTheme") {
      this.darkTheme = !this.darkTheme;
    } else return console.error("Invalid data-aspect input");
  }

  render() {
    return html`
      <div class="toggle">
        ${this.themeToggle()}
      </div>
      <md-theme ?darkTheme=${this.darkTheme}>
        <div class="container">
          <h2 class="sandbox-header">Timeline</h2>
          <div
            style=${`width: ${this.containerWidth}; height: ${this.containerHeight}; overflow: auto;`}
            class="widget-container"
          >
            <cjaas-timeline-widget
              id="timeline-widget"
              person-id="30313-Carl"
              tape-read-token=${tapeRead}
              stream-read-token=${stream}
              limit="15"
              base-url=${baseURL}
            ></cjaas-timeline-widget>
          </div>
          <div
            style=${`width: ${this.containerWidth}; height: ${this.containerHeight}; overflow: auto;`}
            class="widget-container"
          >
            <cjaas-timeline-widget
              id="timeline-widget"
              type="journey-and-stream"
              stream-read-token="missing_token"
              tape-read-token="missing_token"
              limit="15"
              show-filters
              base-url="https://cjaas-devus1-edge.azurewebsites.net"
            >
              <h3 slot="ll10n-no-timeline-message">
                No hay línea de tiempo disponible
              </h3>
            </cjaas-timeline-widget>
          </div>
        </div>
      </md-theme>
    `;
  }
}
