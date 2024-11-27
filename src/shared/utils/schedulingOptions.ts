import { AccessRulesData } from '@root/src/pages/content/ui/overlay/overlay';

function convertCentsToDollars(cents: number) {
  if (typeof cents !== 'number' || isNaN(cents)) {
    throw new Error('Input must be a valid number');
  }
  return (cents / 100).toFixed(2); // Convert and return in 2 decimal places
}
export const generateSchedulingOptions = (accessRules: any[]) => {
  // First, create a map of reward information by reward_id
  const rewardMap = {};

  accessRules?.forEach(item => {
    if (item.type === 'reward') {
      rewardMap[item.id] = {
        reward_id: item.id,
        amount_cents: item.attributes.amount_cents,
        currency: item.attributes.currency,
        is_free_tier: item.attributes.is_free_tier,
        title: item.attributes.title,
        published: item.attributes.published,
      };
    }
  });
  // Now, extract access rules and associate rewards
  const result = [];
  accessRules.forEach(item => {
    if (item.type === 'access-rule') {
      const accessRule = {
        access_rule_id: item.id,
        reward_id: null, // Default reward_id is null
        description: null,
        is_free_tier: null,
        amount_cents: item.attributes?.amount_cents,
        title: item?.attributes?.access_rule_type,
        published: null,
      };

      // Check if the access-rule has a tier (reward)
      if (item.relationships && item.relationships.tier && item.relationships.tier.data) {
        const rewardId = item?.relationships?.tier?.data?.id;
        if (rewardMap[rewardId]) {
          // Add reward information from rewardMap
          accessRule.reward_id = rewardMap[rewardId]?.reward_id;
          accessRule.description = `$${convertCentsToDollars(rewardMap[rewardId]?.amount_cents)}/month`;
          accessRule.is_free_tier = rewardMap[rewardId]?.is_free_tier;
          accessRule.title = rewardMap[rewardId]?.title;
          accessRule.amount_cents = rewardMap[rewardId]?.amount_cents;
          accessRule.published = rewardMap[rewardId]?.published;
        }
      }

      // Push the extracted information to result array
      result.push(accessRule);
    }
  });

  const sortedData = result.sort((a, b) => {
    // Define sort order values
    const getTypeOrder = item => {
      if (item.title.toLowerCase() === 'public') return 1;
      if (item.is_free_tier) return 2;
      if (item.title.toLowerCase() === 'patrons') return 3;
      return 4; // For paid tiers
    };

    const typeOrderA = getTypeOrder(a);
    const typeOrderB = getTypeOrder(b);

    // Sort by type first
    if (typeOrderA !== typeOrderB) {
      return typeOrderA - typeOrderB;
    }

    // For paid tiers, sort by amount_cents in ascending order
    if (typeOrderA === 4 && typeOrderB === 4) {
      return (a.amount_cents || 0) - (b.amount_cents || 0);
    }

    return 0; // No sorting needed if they are of the same type and not paid tiers
  });
  return sortedData as AccessRulesData[];
};
