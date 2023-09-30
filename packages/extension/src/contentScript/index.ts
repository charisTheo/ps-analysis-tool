/*
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * Internal dependencies.
 */
import {
  findSelectedFrameElement,
  removeAllPopovers,
  addPopover,
  toggleFrameHighlighting,
} from './popovers';
import { WEBPAGE_PORT_NAME } from '../constants';
import type { ResponseType } from './types';
import './style.css';

/**
 * Represents the content script for the webpage.
 */
class WebpageContentScript {
  port: chrome.runtime.Port | null = null;
  isInspecting = false;
  isHoveringOnPage = false;

  /**
   * Initialize
   */
  constructor() {
    this.handleHoverEvent = this.handleHoverEvent.bind(this);
    this.abortInspection = this.abortInspection.bind(this);
    this.onMessage = this.onMessage.bind(this);
    this.onDisconnect = this.onDisconnect.bind(this);

    this.listenToConnection();
  }

  listenToConnection() {
    chrome.runtime.onConnect.addListener((port) => {
      if (!port.name.startsWith(WEBPAGE_PORT_NAME)) {
        return;
      }

      this.port = port;

      this.port.onMessage.addListener(this.onMessage);
      this.port.onDisconnect.addListener(this.onDisconnect);
    });
  }

  /**
   * Adds hover event listeners to the document.
   */
  addHoverEventListeners(): void {
    document.addEventListener('mouseover', this.handleHoverEvent);
    document.addEventListener('mouseout', this.handleHoverEvent);
  }

  /**
   * Removes hover event listeners from the document.
   */
  removeHoverEventListeners(): void {
    document.removeEventListener('mouseover', this.handleHoverEvent);
    document.removeEventListener('mouseout', this.handleHoverEvent);
  }

  /**
   * Handles incoming messages from the connected port.
   * @param {ResponseType} response - The incoming message/response from the port.
   */
  onMessage(response: ResponseType) {
    this.isInspecting = response.isInspecting;

    if (response.isInspecting) {
      this.removeHoverEventListeners();
      this.addHoverEventListeners();
      toggleFrameHighlighting(true);

      if (response?.selectedFrame) {
        const frameElement = findSelectedFrameElement(response.selectedFrame);

        if (frameElement) {
          addPopover(frameElement, response, this.isHoveringOnPage);
        } else {
          removeAllPopovers();
        }
      }
    } else {
      this.abortInspection();
    }
  }

  /**
   * Handles the port disconnection event.
   */
  onDisconnect() {
    this.port?.onMessage.removeListener(this.onMessage);
    this.port = null;
    this.abortInspection();
  }

  /**
   * Abort inspection and removes all frame popovers and hover event listeners.
   */
  abortInspection(): void {
    this.removeHoverEventListeners();
    removeAllPopovers();
    toggleFrameHighlighting(false);
  }

  /**
   * Handles hover events, focusing on IFRAME elements when inspecting is enabled.
   * @param {MouseEvent} event - The mouse event triggered by user action.
   */
  handleHoverEvent(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    this.isHoveringOnPage = false;

    if (!this.isInspecting || target.tagName !== 'IFRAME') {
      return;
    }

    this.isHoveringOnPage = true;

    const frame = target as HTMLIFrameElement;
    const srcAttribute = frame.getAttribute('src');

    if (!srcAttribute) {
      addPopover(
        frame,
        {
          isInspecting: true,
        },
        this.isHoveringOnPage
      );

      return;
    }

    let url: URL;

    try {
      url = new URL(srcAttribute);
    } catch (error) {
      return;
    }

    const payload = {
      hover: event?.type === 'mouseover',
      attributes: {
        src: url.origin,
      },
    };

    if (!this.port) {
      return;
    }

    try {
      this.port.postMessage(payload);
    } catch (error) {
      this.abortInspection();
    }
  }
}

// eslint-disable-next-line no-new
new WebpageContentScript();
