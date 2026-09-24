# Field Mapping Reference

## PI Form → Database (`proforma_invoices` table)

| Form Label | DB Column | Notes |
|---|---|---|
| Client | `client_id` | FK to clients |
| PI Date | `pi_date` | |
| Currency | `currency` | USD/AED/EUR |
| Incoterms | `incoterms` | |
| Payment Terms | `payment_terms` | |
| Delivery Date | `delivery_date` | |
| Country of Origin | `country_of_origin` | Default: India |
| Country of Discharge | `country_of_discharge` | |
| Port of Loading | `port_of_loading` | |
| Port of Discharge | `port_of_discharge` | |
| **Consignee Name** | `consignee_name` | Auto-filled from client |
| **Consignee Address** | `consignee_address` | Auto-filled from client |
| Product Name | `product_name` | |
| HS Code | `hs_code` | |
| Description | `description` | |
| Packing Type | `packing_type` | |
| No. & Kind of Packages | `no_kind_of_packages` | |
| Gross Weight | `gross_weight` | |
| Tare Weight | `tare_weight` | |
| Net Weight | `net_weight` | |
| Lot No. | `lot_no` | |
| Bag No. | `bag_no` | |
| Total Qty | `total_quantity` | |
| UOM | `uom` | |
| Unit Rate | `unit_rate` | |
| FOB Amount | `fob_amount` | |
| Freight Amount | `freight_amount` | |
| Total Amount | `total_amount` | Auto-calculated |
| Bank Account | `company_bank_id` | FK to company_bank_accounts |
| Terms & Conditions | `terms_conditions` | Pre-filled default |

**Unused in PI:** `buyer_name`, `buyer_address` (reserved for future use if buyer differs from consignee)

---

## Master Form → Database (`masters` table)

### Consignor (Exporter)
| Form Label | DB Column |
|---|---|
| Consignor Name | `consignor_name` |
| Consignor Address | `consignor_address` |

### Consignee
| Form Label | DB Column |
|---|---|
| Consignee Name | `consignee_name` |
| Consignee Address | `consignee_address` |

### Buyer
| Form Label | DB Column |
|---|---|
| Buyer Name | `buyer_name` |
| Buyer Address | `buyer_address` |

### Invoices & Reference Details
| Form Label | DB Column |
|---|---|
| PI Invoice No. | `invoice_no` |
| PI Invoice Date | `invoice_date` |
| CI Invoice No. | `ci_invoice_no` |
| CI Invoice Date | `ci_invoice_date` |
| PO No. | `po_no` |
| PO Date | `po_date` |
| Other Reference (Form M No.) | `other_ref` |
| LUT ARN No. | `lut_arn_no` |

### Shipping Details
| Form Label | DB Column |
|---|---|
| Port of Loading | `port_of_loading` |
| Port of Discharge | `port_of_discharge` |
| Shipment Date | `shipment_date` |
| Country of Origin | `country_of_origin` |
| Country of Discharge | `country_of_discharge` |
| Vessel No. | `vessel_no` |
| Bill of Lading No. | `bill_of_lading_no` |
| Shipping Bill No. | `shipping_bill_no` |
| Shipping Bill Date | `shipping_bill_date` |

### Payment & LC Details
| Form Label | DB Column |
|---|---|
| Currency | `currency` |
| Incoterms | `incoterms` |
| Payment Terms | `payment_terms` |
| Freight Terms | `freight_terms` |
| Issuing Bank | `issuing_bank` |
| L/C No. and Date | `lc_no_and_date` |
| Select Bank Account | `company_bank_id` |
| Account Name | `account_name` |
| Swift Code | `swift_code` |
| Branch | `branch` |

### Product Details
| Form Label | DB Column | Notes |
|---|---|---|
| Product Name | `product_name` | |
| HS Code | `hs_code` | |
| Description | `description` | |
| Packing Type | `packing_type` | |
| **Tare Weight** | `tare_weight` | Tare weight per package |
| **Net Weight** | `net_weight` | Net weight per package |
| **Gross Weight** | `total_gross_weight` | Total gross weight |
| **Nett Weight** | `nett_weight` | Total net weight |
| **Unit 1** | `unit_1` | e.g., KGS (weight unit) |
| Total Packages | `total_packages` | |
| **Unit 2** | `unit_2` | e.g., BAGS (package unit) |
| UOM | `uom` | |
| Unit Rate | `unit_rate` | |
| Lot No. | `lot_no` | |

### Pricing
| Form Label | DB Column |
|---|---|
| FOB Amount | `fob_amount` |
| Freight Amount | `freight_amount` |
| Total Amount | `total_amount` |
| Amount in Words | `amount_in_words` (auto-generated) |

### Master Identification
| Field | DB Column |
|---|---|
| Master No. | `master_number` + `master_financial_year` (e.g., M_001_2026-27) |
| PI relationship | None; PI fields are stored on the Master and document overrides |

---

## Master-owned PI fields

Current workflow creates Master first. PI values are entered and maintained on Master; no PI-to-Master conversion or `pi_id` relationship is used.

The following fields provide PI document values:

| PI document value | → | Master field |
|---|---|---|
| `pi_number` (formatted 001) | → | `invoice_no` |
| `pi_date` | → | `invoice_date` |
| (company name) | → | `consignor_name` |
| (company address) | → | `consignor_address` |
| `consignee_name` | → | `consignee_name` |
| `consignee_address` | → | `consignee_address` |
| (client name) | → | `buyer_name` |
| (client address) | → | `buyer_address` |
| `country_of_origin` | → | `country_of_origin` |
| `country_of_discharge` | → | `country_of_discharge` |
| `port_of_loading` | → | `port_of_loading` |
| `port_of_discharge` | → | `port_of_discharge` |
| `currency` | → | `currency` |
| `incoterms` | → | `incoterms` |
| `payment_terms` | → | `payment_terms` |
| `product_name` | → | `product_name` |
| `hs_code` | → | `hs_code` |
| `description` | → | `description` |
| `packing_type` | → | `packing_type` |
| `tare_weight` | → | `tare_weight` |
| `gross_weight` | → | `total_gross_weight` |
| `net_weight` | → | `net_weight` AND `nett_weight` |
| `lot_no` | → | `lot_no` |
| `total_quantity` | → | `total_quantity` |
| `uom` | → | `uom` |
| `unit_rate` | → | `unit_rate` |
| `fob_amount` | → | `fob_amount` |
| `freight_amount` | → | `freight_amount` |
| `total_amount` | → | `total_amount` |
| `company_bank_id` | → | `company_bank_id` |
| (bank account_name) | → | `account_name` |
| (bank bank_name) | → | `bank_name` |
| (bank account_no) | → | `account_no` |
| (bank swift_code) | → | `swift_code` |
| (bank branch_address) | → | `branch` |

**NOT copied (entered fresh in Master):** CI Invoice No/Date, PO No/Date, Other Ref, LUT ARN, Shipment Date, Vessel No, BL No, Shipping Bill No/Date, Freight Terms, Issuing Bank, L/C No, Unit 1, Unit 2, Total Packages, Containers

---

## Master → CI (Commercial Invoice) Mapping

| CI Section | Master Field(s) |
|---|---|
| CONSIGNEE | `consignee_name`, `consignee_address` |
| BUYER | `buyer_name`, `buyer_address` |
| NOTIFY PARTY 1 | `consignee_name` |
| NOTIFY PARTY 2 | `buyer_name` |
| INVOICE NO. | `ci_invoice_no` (fallback: `invoice_no`) |
| DATE | `ci_invoice_date` (fallback: `invoice_date`) |
| PO NO. / DATE | `po_no`, `po_date` |
| OTHER REF | `other_ref` |
| LUT ARN No. | `lut_arn_no` |
| PORT OF LOADING | `port_of_loading` |
| PORT OF DISCHARGE | `port_of_discharge` |
| COUNTRY OF ORIGIN | `country_of_origin` |
| COUNTRY OF DISCHARGE | `country_of_discharge` |
| COUNTRY OF SUPPLY | `country_of_supply` |
| Shipment Date | `shipment_date` |
| VESSEL No. | `vessel_no` |
| BILL OF LADING No. | `bill_of_lading_no` |
| CONTAINER No. | From `containers` table (all container_no joined) |
| Incoterms | `incoterms` |
| Payment | `payment_terms` |
| Issuing Bank | `issuing_bank` |
| L/c No. and Date | `lc_no_and_date` |
| PRODUCT | `product_name`, `hs_code` |
| DESCRIPTION | `nett_weight` × `total_packages`, `unit_1`, `unit_2`, `packing_type`, `description` |
| LOT NO. | `lot_no` |
| QTY | `total_quantity`, `unit_1` |
| UNIT RATE | `currency`, `unit_rate`, `unit_1` |
| AMOUNT | `currency`, `total_amount` |
| FOB / Freight / CFR | `fob_amount`, `freight_amount`, `total_amount` |
| AMOUNT IN WORDS | Auto-generated from `total_amount` + `currency` |
| Gross Weight | `total_gross_weight` |
| Nett Weight | `nett_weight` |
| Freight | `freight_terms` |
| Drawn Under L/C | `issuing_bank`, `lc_no_and_date` |
| Account Name | `account_name` |
| Bank Name | `bank_name` |
| A/c No. | `account_no` |
| Branch | `branch` |
| Swift Code | `swift_code` |
| Proforma invoice ref | From joined PI: `pi_number`, `pi_date` |
| Signature | `director_name` from companies table |
