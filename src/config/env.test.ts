import { DEFAULT_API_ORIGIN, normaliseApiOrigin } from './env';

describe('normaliseApiOrigin', () => {
  it('falls back to the production origin when unset or blank', () => {
    expect(normaliseApiOrigin(undefined)).toBe(DEFAULT_API_ORIGIN);
    expect(normaliseApiOrigin('   ')).toBe(DEFAULT_API_ORIGIN);
  });

  it('accepts an https origin and drops a trailing slash', () => {
    expect(normaliseApiOrigin('https://staging.example.co.za/')).toBe('https://staging.example.co.za');
  });

  it('allows http only for localhost', () => {
    expect(normaliseApiOrigin('http://localhost:8000')).toBe('http://localhost:8000');
    expect(() => normaliseApiOrigin('http://asknget.co.za')).toThrow('must use https');
  });

  it('rejects a path, query or hash', () => {
    expect(() => normaliseApiOrigin('https://asknget.co.za/api/v1')).toThrow('origin only');
    expect(() => normaliseApiOrigin('https://asknget.co.za?x=1')).toThrow('origin only');
  });

  it('rejects something that is not a URL', () => {
    expect(() => normaliseApiOrigin('asknget')).toThrow('not a valid URL');
  });
});
