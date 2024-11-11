/* Copyright (C) [2024] [Scheduleon]
 This code is for viewing purposes only. Modification, redistribution, and commercial use are strictly prohibited 
 */
const toCamelCase = (key: string) => {
  return key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};
function transformKeys(obj: any) {
  if (Array.isArray(obj)) {
    return obj.map(transformKeys);
  } else if (typeof obj === 'object' && obj !== null) {
    return Object.entries(obj).reduce((acc, [key, value]) => {
      const newKey = toCamelCase(key);
      acc[newKey] = transformKeys(value);
      return acc;
    }, {});
  }
  return obj;
}
export const createPayloadObj = payloadObj => {
  const transformedPayload = transformKeys(payloadObj?.data?.attributes);

  return {
    ...transformedPayload,
    id: payloadObj?.data?.id,
    type: 'media',
    closedCaptions: [],
    closedCaptionsEnabled: true,
    _ref: {
      data: {
        id: payloadObj?.data?.id,
        type: 'media',
      },
    },
  };
};
