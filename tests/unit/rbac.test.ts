import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Role } from "../../src/shared/types/auth.types.js";

const ROLE_PRIORITY: Record<Role, number> = {
  [Role.SUPER_ADMIN]: 4,
  [Role.ADMIN]: 3,
  [Role.EDUCATION_HEAD]: 2,
  [Role.MENTOR]: 1,
  [Role.STUDENT]: 0,
};

describe("RBAC & Schedule Priority Rules", () => {
  it("should have correct hierarchical rank ordering", () => {
    assert.ok(ROLE_PRIORITY[Role.SUPER_ADMIN] > ROLE_PRIORITY[Role.ADMIN]);
    assert.ok(ROLE_PRIORITY[Role.ADMIN] > ROLE_PRIORITY[Role.EDUCATION_HEAD]);
    assert.ok(ROLE_PRIORITY[Role.EDUCATION_HEAD] > ROLE_PRIORITY[Role.MENTOR]);
    assert.ok(ROLE_PRIORITY[Role.MENTOR] > ROLE_PRIORITY[Role.STUDENT]);
  });

  it("should disallow lower rank from modifying higher rank schedules (SCHEDULE_LOCKED)", () => {
    function canModifySchedule(actorRole: Role, creatorRole: Role): boolean {
      const actorPriority = ROLE_PRIORITY[actorRole] ?? 0;
      const creatorPriority = ROLE_PRIORITY[creatorRole] ?? 0;
      return actorPriority >= creatorPriority;
    }

    // Mentor cannot modify Admin or Education Head event
    assert.equal(canModifySchedule(Role.MENTOR, Role.ADMIN), false);
    assert.equal(canModifySchedule(Role.MENTOR, Role.EDUCATION_HEAD), false);

    // Education Head cannot modify Admin event
    assert.equal(canModifySchedule(Role.EDUCATION_HEAD, Role.ADMIN), false);

    // Admin can modify Education Head and Mentor events
    assert.equal(canModifySchedule(Role.ADMIN, Role.EDUCATION_HEAD), true);
    assert.equal(canModifySchedule(Role.ADMIN, Role.MENTOR), true);

    // Super Admin can modify anything
    assert.equal(canModifySchedule(Role.SUPER_ADMIN, Role.ADMIN), true);
    assert.equal(canModifySchedule(Role.SUPER_ADMIN, Role.MENTOR), true);

    // Mentor can modify their own mentor-level events
    assert.equal(canModifySchedule(Role.MENTOR, Role.MENTOR), true);
  });
});
