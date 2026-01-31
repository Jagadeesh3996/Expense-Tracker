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
| `status` | `text` | | `'active'` | Status: 'active' or 'inactive'. |

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
| `bank_account_id` | `bigint` | **FK** | `NULL` | Optional. References `bank_details(id)`. |
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
| `type` | `text` | | `'expense'` | Category type: 'income' or 'expense'. |
| `status` | `text` | | `'active'` | Category status: 'active' or 'inactive'. |

### Constraints & Indexes

*   **Primary Key**: `id`
*   **Foreign Key**: `user_id` -> `auth.users(id)` (On Delete Cascade)
*   **Check Constraints**:
    *   `type IN ('income', 'expense')`
    *   `status IN ('active', 'inactive')`
*   **Unique Constraint**: `(user_id, name)` - Ensures a user cannot have duplicate category names.

### Security (Row Level Security)

*   **RLS Enabled**: Yes
*   **Policy**: "Users can manage their own categories"
    *   **Permissive**: Users can `SELECT`, `INSERT`, `UPDATE`, `DELETE` rows where `user_id` matches their authenticated ID.

## Table: `bank_details`

Stores user's bank account information.

### Columns

| Name | Type | Key | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `bigint` | **PK** | *Identity (Auto)* | Unique identifier. |
| `bank_name` | `text` | | | Name of the bank (e.g., HDFC). Required. |
| `holder_name` | `text` | | | Name of the account holder. Required. |
| `account_number` | `text` | | | Account number. Optional. |
| `ifsc_code` | `text` | | | IFSC Code. Optional. |
| `branch` | `text` | | | Branch Name. Optional. |
| `status` | `text` | | `'active'` | Status: 'active' or 'inactive'. |
| `user_id` | `uuid` | **FK** | `auth.uid()` | Owner of the record. |
| `created_on` | `timestamptz` | | `now()` | Creation timestamp. |
| `updated_on` | `timestamptz` | | `now()` | Last update timestamp. |

### Constraints & Indexes
*   **Primary Key**: `id`
*   **Foreign Key**: `user_id` -> `auth.users(id)` (On Delete Cascade)
*   **Check Constraints**: `status IN ('active', 'inactive')`
*   **RLS**: Users can manage their own bank details.

---

## Table: `user_profiles`
Stores extended user information, subscription status, and roles.

### Columns
| Column Name | Data Type | Constraints | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `user_id` | `uuid` | **PK, FK** | | References `auth.users(id)`. 1:1 relationship. |
| `role` | `text` | `NOT NULL` | `'user'` | Role: 'user' or 'admin'. |
| `status` | `text` | `NOT NULL` | `'active'` | Status: 'active', 'inactive', 'suspended', 'past_due'. |
| `active_plan` | `text` | `NOT NULL` | `'free'` | Name of the current subscription plan. |
| `verified_on` | `timestamptz` | | `NULL` | Timestamp of email verification. |
| `plan_expire_on` | `timestamptz` | | `NULL` | Date when the current plan expires. |
| `created_on` | `timestamptz` | `NOT NULL` | `now()` | Record creation timestamp. |
| `updated_on` | `timestamptz` | `NOT NULL` | `now()` | Last update timestamp. |

### Policies (RLS)
*   **Users can view own profile**: `auth.uid() = user_id`.

### Triggers
1.  **`on_auth_user_created`**: Automatically inserts a row into `user_profiles` when a new user signs up in `auth.users`.
2.  **`on_auth_user_verified`**: Watches `auth.users` for verification. When verified, updates `verified_on` and sets `plan_expire_on` to **3 months** from verification date.
