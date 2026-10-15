// created_at is a `timestamp without time zone` stored in UTC — add the Z so
// the browser doesn't read it as local time.
export const parseTs = (v) => {
  if (!v) return new Date(NaN);
  const s = String(v);
  return new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(s) ? s : s.replace(" ", "T") + "Z");
};
