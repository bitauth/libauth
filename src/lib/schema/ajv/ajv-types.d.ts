/* eslint-disable @typescript-eslint/no-explicit-any */
export interface AjvError<
  Keyword = string,
  Params = { [paramName: string]: number | string }
> {
  keyword: Keyword;
  instancePath: string;
  schemaPath: string;
  params: Params;
  message: string;
}

export type LibauthAjvError =
  | AjvError<'additionalProperties', { additionalProperty: string }>
  | AjvError<'required', { missingProperty: string }>
  | AjvError<'type', { type: string }>;

/**
 * Note: these types cover only Libauth use cases; other `ajv` error types are
 * possible using other settings.
 */
// eslint-disable-next-line functional/no-mixed-type
export interface AjvValidator<T = unknown> {
  (
    data: unknown,
    dataCxt?: {
      instancePath?: string;
      parentData: any;
      parentDataProperty: any;
      rootData?: any;
    }
  ): data is T;
  errors?: LibauthAjvError[] | null;
}
