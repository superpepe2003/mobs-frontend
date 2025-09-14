export interface BossKill {
  fecha_raw: string;
  fecha_iso: string;
  monstruo: string;
  jugador: string;
  servidor: string;
  mapa: string;
  respawn_hours: number;
  next_respawn: string;
  time_until_respawn: string;
  respawn_status: string;
}

export interface BossKillResponse {
  count: number;
  results: BossKill[];
}
