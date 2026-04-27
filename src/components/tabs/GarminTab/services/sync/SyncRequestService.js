/**
 * Service responsable de la création du payload de synchronisation et de l'appel réseau.
 */

import { performSyncRequest } from '../../hooks/garminSyncCore';

export class SyncRequestService {
  buildRequestBody(rangeInfo, context) {
    const { startDate, endDate, lastSyncTimestamp } = rangeInfo;
    const {
      forceMode = null,
      includeToday = false,
      forceRange = null,
      extraPayload = null
    } = context;

    const requestBody = {};

    if (forceMode) {
      requestBody.mode = forceMode;
      requestBody.forceRefresh = true;
      requestBody.includeToday = includeToday;

      if (forceRange && (forceRange.start || forceRange.end)) {
        requestBody.range = { ...forceRange };
        if (forceRange.start) {
          requestBody.rangeStart = forceRange.start;
        }
        if (forceRange.end) {
          requestBody.rangeEnd = forceRange.end;
        }
      }

      if (startDate) {
        requestBody.start = startDate;
      }
      if (endDate) {
        requestBody.end = endDate;
      }

    }

    if (extraPayload && typeof extraPayload === 'object') {
      Object.assign(requestBody, extraPayload);
    }

    if (lastSyncTimestamp) {
      requestBody.lastSyncTimestamp = lastSyncTimestamp;
    }

    return requestBody;
  }

  async fetch(rangeInfo, context) {
    const {
      forceRefresh = false,
      fetcher,
      frontendCache,
      todayStr,
      setStatus = () => {}
    } = context;

    if (typeof fetcher !== 'function') {
      throw new Error('SyncRequestService requires a fetcher function in context');
    }

    const requestBody = this.buildRequestBody(rangeInfo, context);
    const requestBodyPayload = Object.keys(requestBody).length > 0 ? requestBody : null;

    const descriptor = {
      startDate: rangeInfo.startDate,
      endDate: rangeInfo.endDate,
      lastSyncTimestamp: rangeInfo.lastSyncTimestamp,
      forceRefresh,
      requestBody: requestBodyPayload
    };

    try {
      const json = await performSyncRequest(
        descriptor,
        fetcher,
        frontendCache,
        todayStr,
        setStatus,
        {
          onForcedDegrade: typeof context.onForcedDegrade === 'function'
            ? (meta) => context.onForcedDegrade({
              ...meta,
              requestDescriptor: descriptor
            })
            : null,
          forceDegradeThresholdMs: context.forceDegradeThresholdMs
        }
      );

      if (json && typeof json === 'object') {
        json.diagnostic = {
          ...(json.diagnostic || {}),
          requestPayload: descriptor.requestBody
        };
      }

      return {
        json,
        requestBody: requestBodyPayload
      };
    } catch (error) {
      error.__garminRequestPayload = requestBodyPayload;
      throw error;
    }
  }
}
