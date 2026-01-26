# Database Schema Documentation

## Table: `payment_modes`

Stores user-defined payment methods (e.g., Cash, Credit Card, UPI). This table is user-specific, meaning users can only manage their own payment modes.

### Columns

| Name | Type | Key | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `bigint` | **PK** | *Identity (Auto)* | Unique identifier for the payment mode. |
| `mode` | `text` | | | Name of the payment mode (e.g., "Cash"). Unique per user. |
| `created_on` | `timestamptz` | | `now()` | Timestamp when the record was created. |
| `updated_on` | `timestamptz` | | `now()` | Timestamp when the record was last updated. Automatically managed by trigger. |
| `user_id` | `uuid` | **FK** | `auth.uid()` | ID of the user who owns this payment mode. References `auth.users`. |

### Constraints & Indexes

*   **Primary Key**: `id`
*   **Foreign Key**: `user_id` -> `auth.users(id)` (On Delete Cascade)
*   **Unique Constraint**: `(user_id, mode)` - Ensures a user cannot have duplicate payment mode names.

### Security (Row Level Security)

*   **RLS Enabled**: Yes
*   **Policy**: "Users can manage own payment modes"
    *   **Permissive**: Users can `SELECT`, `INSERT`, `UPDATE`, `DELETE` rows where `user_id` matches their authenticated ID.
