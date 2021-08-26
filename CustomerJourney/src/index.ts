/**
 * Copyright (c) Cisco Systems, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// This file imports all of the webcomponents from "components" folder

import {
  html,
  internalProperty,
  property,
  LitElement,
  PropertyValues,
  query
} from "lit-element";
import { nothing } from "lit-html";
import { classMap } from "lit-html/directives/class-map";
import { customElementWithCheck } from "./mixins/CustomElementCheck";
import styles from "./assets/styles/View.scss";
import { ServerSentEvent } from "./types/cjaas";
import { EventSourceInitDict } from "eventsource";
import "@cjaas/common-components/dist/comp/cjaas-timeline-item";
import "@cjaas/common-components/dist/comp/cjaas-timeline";
import "@cjaas/common-components/dist/comp/cjaas-event-toggles";
export interface CustomerEvent {
  data: Record<string, any>;
  firstName: string;
  lastName: string;
  email: string;
  datacontenttype: string;
  id: string;
  person: string;
  source: string;
  specversion: string;
  time: string;
  type: string;
}

@customElementWithCheck("customer-journey-widget")
export default class CustomerJourneyWidget extends LitElement {
  @property({ type: String, attribute: "base-url" }) baseURL:
    | string
    | undefined = undefined;
  @property({ type: String, reflect: true }) customer: string | null = null;
  @property({ type: String, attribute: "tape-token" }) tapeToken:
    | string
    | null = null;
  @property({ type: String, attribute: "stream-token" }) streamToken:
    | string
    | null = null;
  @property({ reflect: true }) pagination = "$top=15"; // Not Implemented as of 8/26/21
  @property({ type: Number }) limit = 5;
  @property({ attribute: false }) interactionData: Interaction | undefined;

  @internalProperty() events: Array<CustomerEvent> = [];
  @internalProperty() newestEvents: Array<CustomerEvent> = [];
  @internalProperty() eventSource: EventSource | null = null;
  @internalProperty() liveLoading = false;
  @internalProperty() loading = true;
  @internalProperty() expanded = false;
  @internalProperty() errorMessage = "";

  @query(".container") container!: HTMLElement;
  @query("#customerInput") customerInput!: HTMLInputElement;

  connectedCallback() {
    super.connectedCallback();
    if (this.interactionData) {
      this.customer = this.interactionData["ani"];
    }
  }

  async lifecycleTasks() {
    const data = await this.getExistingEvents();
    this.events = data.events;
    this.loading = false;
    this.requestUpdate();
    this.subscribeToStream();
  }

  async firstUpdated(changedProperties: PropertyValues) {
    super.firstUpdated(changedProperties);
    await this.lifecycleTasks();

    // @ts-ignore
    const ro = new ResizeObserver((entries: any) => {
      for (const entry of entries) {
        const cr = entry.contentRect;
        if (cr.width < 589) {
          this.expanded = false;
        } else {
          this.expanded = true;
        }
      }
    });
    ro.observe(this.container as Element);
  }

  private get resizeClassMap() {
    return {
      expanded: this.expanded
    };
  }

  async update(changedProperties: PropertyValues) {
    super.update(changedProperties);

    if (changedProperties.has("interactionData")) {
      if (this.interactionData) {
        this.customer = this.interactionData["ani"];
      } else {
        this.customer = null;
      }
    }

    if (changedProperties.has("customer")) {
      this.newestEvents = [];
      await this.lifecycleTasks();
    }
  }

  changeCustomer() {
    this.customer = this.customerInput.value;
  }

  baseUrlCheck() {
    if (this.baseURL === undefined) {
      console.error("You must provide a Base URL");
      throw new Error("You must provide a Base URL");
    }
  }

  async getExistingEvents() {
    this.loading = true;
    this.baseUrlCheck();
    // TO DO: Paginate the results, only get the top 100, but come back for more when requested
    return fetch(
      `${this.baseURL}/v1/journey/streams/historic/${this.customer}`,
      {
        headers: {
          "content-type": "application/json; charset=UTF-8",
          accept: "application/json",
          Authorization: `SharedAccessSignature ${this.tapeToken}`
        },
        method: "GET"
      }
    )
      .then((x: Response) => {
        return x.json();
      })
      .then(data => {
        return data;
      })
      .catch(err => {
        this.loading = false;
        this.errorMessage = `Failure to fetch Journey ${err}`;
      });
  }

  subscribeToStream() {
    if (this.eventSource) {
      this.eventSource.close();
    }

    this.baseUrlCheck();
    if (this.streamToken) {
      const header: EventSourceInitDict = {
        headers: {
          "content-type": "application/json; charset=UTF-8",
          accept: "application/json",
          Authorization: `SharedAccessSignature ${this.streamToken}`
        }
      };
      this.eventSource = new EventSource(
        `${this.baseURL}/v1/journey/streams/${this.customer}?${this.streamToken}`,
        header
      );
    }

    this.eventSource!.onmessage = (event: ServerSentEvent) => {
      let data;
      try {
        data = JSON.parse(event.data);
        this.newestEvents.unshift(data);
        if (this.liveLoading) {
          this.showNewEvents();
        }
        this.requestUpdate();
      } catch (err) {
        console.log("Event Source Ping: ", event);
      }
    };

    this.eventSource!.onerror = () => {
      this.loading = false;
    };
  }

  showNewEvents() {
    if (this.newestEvents.length > 0) {
      this.events = [...this.events, ...this.newestEvents];
      this.newestEvents = [];
      this.requestUpdate();
    }
  }

  toggleLiveEvents() {
    this.liveLoading = !this.liveLoading;
    if (this.newestEvents.length > 0) {
      this.showNewEvents();
    }
  }

  renderNewEventQueueToggle() {
    return html`
      <md-toggle-switch
        smaller
        @click=${() => this.toggleLiveEvents()}
        ?checked=${this.liveLoading}
      >
        <span style="font-size:.75rem;">
          Show live events
        </span>
      </md-toggle-switch>
      ${this.renderNewEventCounter()}
    `;
  }

  renderNewEventCounter() {
    return this.newestEvents.length > 0
      ? html`
          <md-chip
            class="event-counter"
            small
            color="blue"
            @click=${() => this.showNewEvents()}
            value="Show ${this.newestEvents.length} new events"
          ></md-chip>
        `
      : nothing;
  }

  renderEvents() {
    return html`
      <cjaas-timeline
        .timelineItems=${this.events}
        limit=${this.limit}
        show-filters
      ></cjaas-timeline>
    `;
  }

  renderLoader() {
    return html`
      <md-loading size="middle"></md-loading>
    `;
  }

  renderEventList() {
    return html`
      <section id="events-list">
        <div class="new-events">
          ${this.renderNewEventQueueToggle()}
        </div>
        ${this.renderEvents()}
      </section>
    `;
  }

  static get styles() {
    return styles;
  }

  render() {
    return html`
      <div class="profile ${classMap(this.resizeClassMap)}">
        <md-input
          id="customerInput"
          class="profile"
          shape="pill"
          placeholder="Journey ID e.g. '98126-Kevin'"
        ></md-input>
        <md-button @click=${() => this.changeCustomer()}
          >Load Journey</md-button
        >
      </div>
      <div class="container ${classMap(this.resizeClassMap)}">
        ${this.loading ? this.renderLoader() : this.renderEventList()}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "customer-journey-widget": CustomerJourneyWidget;
  }
}
