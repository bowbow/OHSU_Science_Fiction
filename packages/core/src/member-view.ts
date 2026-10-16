export type MemberRole = "regular" | "admin";

export type MemberView = {
  id: string;
  username: string;
  role: MemberRole;
};

export type MemberRow = {
  id: string;
  username: string;
  role: MemberRole;
};

export function toMemberView(row: MemberRow): MemberView {
  return {
    id: row.id,
    username: row.username,
    role: row.role,
  };
}
