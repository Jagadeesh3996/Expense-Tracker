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

## Table: `transactions`

Stores the core financial records (Income and Expenses).

### Columns

| Name | Type | Key | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `bigint` | **PK** | *Identity (Auto)* | Unique identifier for the transaction. |
| `transaction_date` | `date` | | | The date the transaction occurred. |
| `amount` | `decimal(12,2)` | | | The monetary value. Must be positive (> 0). |
| `type` | `text` | | | Either 'income' or 'expense'. |
| `category_id` | `bigint` | **FK** | | References `categories(id)`. Cannot delete category if used (RESTRICT). |
| `payment_mode_id` | `bigint` | **FK** | | References `payment_modes(id)`. Cannot delete mode if used (RESTRICT). |
| `description` | `text` | | `NULL` | Optional notes about the transaction. |
| `created_on` | `timestamptz` | | `now()` | Record creation timestamp. |
| `updated_on` | `timestamptz` | | `now()` | Last update timestamp (auto-managed). |
| `user_id` | `uuid` | **FK** | `auth.uid()` | Owner of the transaction. |

### Constraints & Indexes

*   **Primary Key**: `id`
*   **Foreign Keys**: 
    *   `category_id` -> `categories(id)` (On Delete Cascade)
    *   `payment_mode_id` -> `payment_modes(id)` (On Delete Cascade)
    *   `user_id` -> `auth.users(id)` (On Delete Cascade)
*   **Check Constraints**:
    *   `amount > 0`
    *   `type IN ('income', 'expense')`
*   **Indexes**:
    *   `user_id` (Security performance)
    *   `transaction_date` (Reporting performance)
    *   `category_id`, `payment_mode_id` (Join performance)

### Security (Row Level Security)

*   **RLS Enabled**: Yes
*   **Policy**: "Users can manage their own transactions"
    *   **Permissive**: Full CRUD access for own data (`user_id = auth.uid()`).

## Table: `categories`

Stores user-defined categories (e.g., Food, Travel). This table is user-specific.

### Columns

| Name | Type | Key | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `bigint` | **PK** | *Identity (Auto)* | Unique identifier for the category. |
| `name` | `text` | | | Name of the category. Unique per user. |
| `created_on` | `timestamptz` | | `now()` | Timestamp when the record was created. |
| `updated_on` | `timestamptz` | | `now()` | Timestamp when the record was last updated. Automatically managed by trigger. |
| `user_id` | `uuid` | **FK** | `auth.uid()` | ID of the user who owns this category. References `auth.users`. |

### Constraints & Indexes

*   **Primary Key**: `id`
*   **Foreign Key**: `user_id` -> `auth.users(id)` (On Delete Cascade)
*   **Unique Constraint**: `(user_id, name)` - Ensures a user cannot have duplicate category names.

### Security (Row Level Security)

*   **RLS Enabled**: Yes
*   **Policy**: "Users can manage their own categories"
    *   **Permissive**: Users can `SELECT`, `INSERT`, `UPDATE`, `DELETE` rows where `user_id` matches their authenticated ID.
