/* Copyright (C) [2024] [Scheduleon]
 This code is for viewing purposes only. Modification, redistribution, and commercial use are strictly prohibited 
 */
export interface selectedDataType {
  access_rule_id: string;
  date: string;
  time: string;
  date_time: string;
}
export interface ErrorTypes {
  rowId: string;
  message: string;
}
export type AccessRulesData = {
  access_rule_id: string;
  reward_id: string;
  description: string;
  is_free_tier: boolean;
  title: string;
  published: boolean;
  amount_cents: number;
};
