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
 * External dependencies.
 */
import { type Cookie as ParsedCookie } from 'simple-cookie';
import { type SortingState, type VisibilityState } from '@tanstack/react-table';

/**
 * Internal dependencies.
 */
import type { SelectedFilters } from '../view/devtools/stateProviders/filterManagementStore/types';
import type { CookieAnalytics } from '../utils/fetchCookieDictionary';

export type CookieData = {
  parsedCookie: ParsedCookie;
  analytics: CookieAnalytics | null;
  url: string;
  headerType: 'response' | 'request';
  isFirstParty: boolean | null;
  frameIdList: number[];
};

export type PreferenceDataValues =
  | SortingState
  | Record<string, number>
  | string
  | SelectedFilters
  | VisibilityState
  | null;
export type PreferenceData = {
  [key: string]: PreferenceDataValues;
};
export type TabData = {
  cookies: {
    [key: string]: CookieData;
  } | null;
  focusedAt: number | null;
  preferences: PreferenceData;
};

export type Storage = {
  [tabId: string]: TabData;
};
