import api, { route } from '@forge/api';

const MAX_DEPTH = 1;

/**
 * Helper function to retrieve issue IDs linked to the given issue.
 * Supports optional recursive traversal up to MAX_DEPTH.
 * Optional link type filtering matches on name, inward, or outward properties.
 *
 * @param {string} issueKey - The Jira issue key.
 * @param {string} [linkType] - Optional substring to filter the link type by.
 * @param {number} depth - The current depth of the recursion.
 * @param {Set<string>} visited - A Set of issue IDs that have been already visited (prevents cycles).
 * @returns {Promise<Set<string>>} - A Promise resolving to a Set of unique issue IDs.
 */
async function getLinkedIssueIds(issueKey, linkType = null, depth = 1, visited = new Set()) {
  if (!issueKey) {
    throw new Error('issueKey is required');
  }

  // Prevent traversing further than MAX_DEPTH
  if (depth > MAX_DEPTH) {
    return new Set();
  }

  const response = await api.asApp().requestJira(route`/rest/api/3/issue/${issueKey}?fields=issuelinks`);

  if (!response.ok) {
    throw new Error(`Jira API returned status ${response.status} for issueKey ${issueKey}`);
  }

  const data = await response.json();
  const links = data.fields?.issuelinks || [];
  
  const linkedIds = new Set();
  const nextKeys = [];

  for (const link of links) {
    if (linkType) {
      const matchText = linkType.toLowerCase();
      const typeName = link.type?.name?.toLowerCase() || '';
      const inward = link.type?.inward?.toLowerCase() || '';
      const outward = link.type?.outward?.toLowerCase() || '';

      const isMatch = typeName.includes(matchText) ||
                      inward.includes(matchText) ||
                      outward.includes(matchText);

      if (!isMatch) {
        continue;
      }
    }

    // Process inward issue
    if (link.inwardIssue) {
      const id = link.inwardIssue.id;
      if (!visited.has(id)) {
        visited.add(id);
        linkedIds.add(id);
        nextKeys.push(link.inwardIssue.key);
      }
    }

    // Process outward issue
    if (link.outwardIssue) {
      const id = link.outwardIssue.id;
      if (!visited.has(id)) {
        visited.add(id);
        linkedIds.add(id);
        nextKeys.push(link.outwardIssue.key);
      }
    }
  }

  // Recursively process linked issues if we have not reached the depth limit
  if (depth < MAX_DEPTH) {
    for (const key of nextKeys) {
      const childIds = await getLinkedIssueIds(key, linkType, depth + 1, visited);
      for (const childId of childIds) {
        linkedIds.add(childId);
      }
    }
  }

  return linkedIds;
}

export const handler = async (req) => {
  console.log("--- New JQL Search Executed ---");
  console.log("Raw JQL Handler Payload:", JSON.stringify(req));

  // Extract arguments from Forge's native JQL function payload format
  const clauseArguments = req?.clause?.arguments || req?.arguments || [];
  
  const issueKey = clauseArguments[0];
  const linkType = clauseArguments[1] || null;

  console.log(`Extracted Arguments -> issueKey: ${issueKey}, linkType: ${linkType}`);

  if (!issueKey) {
    console.error("Error: issueKey was not provided. JQL function requires it.");
    throw new Error('issueKey was not provided. This argument is required to evaluate linked issues.');
  }

  // Set maintains visited nodes to prevent cycles in cyclic graphs
  const visited = new Set();
  console.log(`Fetching linked issues for ${issueKey}...`);
  const linkedIds = await getLinkedIssueIds(issueKey, linkType, 1, visited);

  console.log(`Found ${linkedIds.size} linked issue(s).`);

  if (linkedIds.size === 0) {
    console.log("Returning empty fallback JQL: issueKey = empty");
    console.log("-------------------------------");
    return {
      jql: "issueKey = empty"
    };
  }

  const idList = Array.from(linkedIds).join(',');
  const resultingJql = `id in (${idList})`;
  console.log(`Returning JQL fragment: ${resultingJql}`);
  console.log("-------------------------------");

  return {
    jql: resultingJql
  };
};
