import { computeDependencyFlagsForFields, type DependsOnContext } from './depends_on'

export interface FieldDependencyState {
  hidden_due_to_dependency?: boolean
  /**
   * Effective values like Desk set_df_property would set (0/1).
   * Only present if the corresponding *_depends_on exists on the field.
   */
  reqd?: 0 | 1
  read_only?: 0 | 1
}

export type DependencyStateMap = Record<string, FieldDependencyState>

/**
 * Compute derived dependency state for DocType fields, matching Desk behavior.
 *
 * Desk details:
 * - depends_on -> toggles df.hidden_due_to_dependency
 * - mandatory_depends_on -> sets df.reqd = 1/0
 * - read_only_depends_on -> sets df.read_only = 1/0
 */
export function computeDependencyStateForMetaFields(
  metaFields: any[],
  ctx: DependsOnContext
): DependencyStateMap {
  const flags = computeDependencyFlagsForFields(metaFields || [], ctx)
  const out: DependencyStateMap = {}

  for (const f of metaFields || []) {
    const fieldname = f?.fieldname
    if (!fieldname) continue

    const ff = flags[fieldname]
    if (!ff) continue

    const st: FieldDependencyState = {}

    if (ff.hidden_due_to_dependency !== undefined) {
      st.hidden_due_to_dependency = ff.hidden_due_to_dependency
    }

    if (f.mandatory_depends_on) {
      st.reqd = ff.reqd_due_to_dependency ? 1 : 0
    }

    if (f.read_only_depends_on) {
      st.read_only = ff.read_only_due_to_dependency ? 1 : 0
    }

    out[fieldname] = st
  }

  return out
}


