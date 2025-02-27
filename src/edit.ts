import { Attributes, LoadingService, Locale, MetaModel, resources, ResourceService, StringMap, UIService, ViewService } from './core';
import { build as build2 } from './metadata';

interface ErrorMessage {
  field: string;
  code: string;
  param?: string | number | Date;
  message?: string;
}
// export type Status = 0 | 1 | 2 | 4 | 8;
export interface ResultInfo<T> {
  status: string | number;
  errors?: ErrorMessage[];
  value?: T;
  message?: string;
}
export interface EditParameter {
  resource: ResourceService;
  showMessage: (msg: string, option?: string) => void;
  showError: (m: string, callback?: () => void, header?: string) => void;
  confirm: (m2: string, yesCallback?: () => void, header?: string, btnLeftText?: string, btnRightText?: string, noCallback?: () => void) => void;
  ui?: UIService;
  getLocale?: (profile?: string) => Locale;
  loading?: LoadingService;
  // status?: EditStatusConfig;
}
export interface GenericService<T, ID, R> extends ViewService<T, ID> {
  patch?(obj: Partial<T>, ctx?: any): Promise<R>;
  create(obj: T, ctx?: any): Promise<R>;
  update(obj: T, ctx?: any): Promise<R>;
  delete?(id: ID, ctx?: any): Promise<number>;
}

export function build(attributes: Attributes, ignoreDate?: boolean, name?: string): MetaModel {
  if (resources.cache && name && name.length > 0) {
    let meta: MetaModel = resources._cache[name];
    if (!meta) {
      meta = build2(attributes, ignoreDate);
      resources._cache[name] = meta;
    }
    return meta;
  } else {
    return build2(attributes, ignoreDate);
  }
}

export function createModel<T>(attributes?: Attributes): T {
  const obj: any = {};
  if (!attributes) {
    return obj;
  }
  const attrs = Object.keys(attributes);
  for (const k of attrs) {
    const attr = attributes[k];
    if (attr.name) {
      switch (attr.type) {
        case 'string':
        case 'text':
          obj[attr.name] = '';
          break;
        case 'integer':
        case 'number':
          obj[attr.name] = 0;
          break;
        case 'array':
          obj[attr.name] = [];
          break;
        case 'boolean':
          obj[attr.name] = false;
          break;
        case 'date':
          obj[attr.name] = new Date();
          break;
        case 'object':
          if (attr.typeof) {
            const object = createModel(attr.typeof);
            obj[attr.name] = object;
            break;
          } else {
            obj[attr.name] = {};
            break;
          }
        case 'ObjectId':
          obj[attr.name] = null;
          break;
        default:
          obj[attr.name] = '';
          break;
      }
    }
  }
  return obj;
}
/*
export function handleStatus(x: number|string, st: EditStatusConfig, gv: (k: string, p?: any) => string, se: (m: string, title?: string, detail?: string, callback?: () => void) => void): void {
  const title = gv('error');
  if (x === st.version_error) {
    se(gv('error_version'), title);
  } else if (x === st.data_corrupt) {
    se(gv('error_data_corrupt'), title);
  } else {
    se(gv('error_internal'), title);
  }
}
*/
export function handleVersion<T>(obj: T, version?: string): void {
  if (obj && version && version.length > 0) {
    const v = (obj as any)[version];
    if (v && typeof v === 'number') {
      (obj as any)[version] = v + 1;
    } else {
      (obj as any)[version] = 1;
    }
  }
}
export function isSuccessful<T>(x: number|T|ErrorMessage[]): boolean {
  if (Array.isArray(x)) {
    return false;
  } else if (typeof x === 'object') {
    return true;
  } else if (typeof x === 'number' && x > 0) {
    return true;
  }
  return false;
}

type Result<T> = number | T | ErrorMessage[];
export function afterSaved<T>(res: Result<T>, form: HTMLFormElement|undefined, resource: StringMap, showFormError: (form?: HTMLFormElement, errors?: ErrorMessage[]) => ErrorMessage[], alertSuccess: (msg: string, callback?: () => void) => void, alertError :(msg: string) => void) {
  if (Array.isArray(res)) {
    showFormError(form, res)
  } else if (isSuccessful(res)) {
    alertSuccess(resource.msg_save_success, () => window.history.back())
  } else if (res === 0) {
    alertError(resource.error_not_found)
  } else {
    alertError(resource.error_conflict)
  }
}
