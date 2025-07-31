/* ------------------------------------------------------------------
   DEF CON 33 – Schedule / Content model
   ------------------------------------------------------------------ */

export interface FirestoreTimestamp {
  /** Always `"firestore/timestamp/1.0"` */
  type: string;
  /** Seconds since Unix epoch */
  seconds: number;
  /** Nanoseconds fraction */
  nanoseconds: number;
}

/* ---------- Media ------------------------------------------------ */

export interface MediaAsset {
  name: string;
  asset_id: number;
  filesize: number;
  filetype: string; // e.g. "image/webp"
  url: string;
  sort_order: number;
  /** Hashes (may be empty strings) */
  hash_md5: string;
  hash_crc32c?: string;
  hash_sha256?: string;
  /** Present only for person avatars */
  person_id?: number;
  /** Present only for avatars */
  asset_uuid?: string;
}

/* ---------- Speaker & People ------------------------------------ */

export interface Affiliation {
  organization: string;
  title: string;
}

export interface Speaker {
  name: string;
  event_ids: number[];
  conference_id: number;
  updated_tsz: string; // ISO-8601
  media: MediaAsset[];
  avatar: MediaAsset | null;
  title: string; // Job title / company
  affiliations: Affiliation[];
  id: number; // Person ID
  content_ids: number[];
  pronouns?: string | null;
  links: Link[];
}

/** Lightweight reference in the `people` array */
export interface PersonRef {
  person_id: number;
  sort_order: number;
  tag_id: number;
}

/* ---------- Location / Type / Links ------------------------------ */

export interface Location {
  name: string;
  id: number;
  parent_id: number;
  short_name: string;
  hotel: string;
}

export interface EventType {
  name: string; // e.g. "DEF CON Official Talk"
  updated_at: string; // ISO-8601
  conference_id: number;
  color: string; // Hex
  id: number;
  updated_tsz: string; // ISO-8601
  conference: string; // "DEFCON33"
}

export interface Link {
  label: string;
  url: string;
  type: string; // usually "link"
}

/* ---------- The main Event object ------------------------------- */

export interface DefconEvent {
  /* Core metadata */
  id: number;
  title: string;
  conference: string; // "DEFCON33"
  conference_id: number;
  timezone: string; // IANA zone (e.g. "America/Los_Angeles")

  /* Timing (raw strings) */
  begin: string; // "2025-08-08T17:00:00.000-0000"
  end: string;
  begin_tsz: string; // UTC-style "Z" string
  end_tsz: string;
  updated: string; // last-modified (ISO string)
  updated_tsz: string;

  /* Timing (parsed Firestore style) */
  begin_timestamp: FirestoreTimestamp;
  end_timestamp: FirestoreTimestamp;
  updated_timestamp: FirestoreTimestamp;

  /* Schedule grouping */
  timeband_id: number;
  spans_timebands: "Y" | "N";

  /* Descriptive content */
  description: string;
  android_description?: string;
  includes: string;
  tags: string;
  tag_ids: number[];

  /* Relationships */
  location: Location;
  speakers: Speaker[];
  people: PersonRef[];
  type: EventType;
  links: Link[];
  media: MediaAsset[];

  /* Miscellaneous / nullable */
  content_id: number;
  village_id: number | null;
  logo: string | null;
  link: string; // often empty ""
}

/* ---------- Convenience aliases ---------------------------------- */

export type DefconSchedule = DefconEvent[];

/* ------------------------------------------------------------------
   Firebase “products” collection – DEF CON merch
   ------------------------------------------------------------------ */

export interface FBMedia {
  product_id: number;
  asset_id: number;
  name: string;
  url: string;
  filetype: string; // e.g. "image/webp"
  filesize: number;
  sort_order: number;
  hash_md5: string;
  hash_sha256: string;
}

export type StockStatus = "IN" | "OUT" | "LOW" | "PRE" | string;

export interface FBVariant {
  variant_id: number;
  product_id: number;
  /** Size / flavour code, e.g. "M" or "BLK" */
  code: string;
  title: string;
  price: number; // value in cents
  sort_order: number;
  stock_status: StockStatus;
  tag_ids: number[];
  tags: string[];
}

export interface FBProduct {
  /* Identifiers ---------------------------------------------------- */
  id: number; // same as product_id
  product_id: number;
  code: string; // short SKU fragment
  title: string;

  /* Descriptive ---------------------------------------------------- */
  description: string;
  tags: string[];
  tag_ids: number[];

  /* Pricing -------------------------------------------------------- */
  price_min: number; // cents
  price_max: number; // cents

  /* Eligibility ---------------------------------------------------- */
  is_eligibility_restricted: "Y" | "N";
  eligibility_restriction_text: string | null;

  /* Sort / display ------------------------------------------------- */
  sort_order: number;

  /* Media & variants ---------------------------------------------- */
  media: FBMedia[];
  variants: FBVariant[];

  /* Miscellaneous fallback for un-modelled keys -------------------- */
  [extra: string]: unknown;
}

export interface FBProductDocument {
  name: string; // Firestore doc ID
  fields: FBProduct;
}

export interface FBProducts {
  documents: FBProductDocument[];
}
