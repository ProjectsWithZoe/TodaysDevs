export async function myRooms(request, reply) {
  const userId = request.user.sub

  const { rows } = await request.server.db.query(
    `SELECT
       t.id, t.project_id, t.mode, t.status, t.join_code, t.created_at,
       p.title AS project_title,
       COUNT(all_members.user_id)::int AS member_count
     FROM teams t
     JOIN team_members my_seat
       ON my_seat.team_id = t.id AND my_seat.user_id = $1
     JOIN projects p
       ON p.id = t.project_id
     LEFT JOIN team_members all_members
       ON all_members.team_id = t.id
     GROUP BY t.id, p.title
     ORDER BY t.created_at DESC`,
    [userId]
  )

  return reply.send(rows)
}
