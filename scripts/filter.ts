import { IIdentity } from "./controls/IdentityPicker";
import { IProperties } from "./events";
import { CachedValue } from "./data/CachedValue";
import { defaultRepostory } from "./data/git/repositories";

export interface IEnabledProviders {
    Commit: boolean;
    CreatePullRequest: boolean;
    ClosePullRequest: boolean;
    CreateWorkItem: boolean;
    CloseWorkItem: boolean;
    ResolveWorkItem: boolean;
    Changeset: boolean;
}

export interface IContributionFilter {
    identity: IIdentity;
    allProjects: boolean;
    startDate?: Date;
    endDate?: Date;
    enabledProviders: IEnabledProviders;
    repository?: {key: string; name: string};
}

export function deepEqual(x, y): boolean {
  return (x && y && typeof x === 'object' && typeof y === 'object') ?
    (Object.keys(x).length === Object.keys(y).length) &&
      Object.keys(x).reduce(function(isEqual, key) {
        return isEqual && deepEqual(x[key], y[key]);
      }, true) : (x === y);
}

export function filterToIProperties(filter: IContributionFilter): IProperties {
    const properties: IProperties = {};
    for (let providerKey in filter.enabledProviders) {
        properties[providerKey] = String(filter.enabledProviders[providerKey]);
    }
    properties["selectedDate"] = String(!!filter.startDate);
    properties["allProjects"] = String(!!filter.allProjects);
    return properties;
}

export const defaultFilter: CachedValue<IContributionFilter> = new CachedValue(getDefaultFilter);
function getDefaultFilter(): Q.IPromise<IContributionFilter> {
  return defaultRepostory.getValue().then(defaultRepo => ({
    identity: {
      displayName: VSS.getWebContext().user.name,
      id: VSS.getWebContext().user.id,
      uniqueName: VSS.getWebContext().user.email,
      imageUrl: `${VSS.getWebContext().collection
        .uri}_api/_common/identityImage?size=2&id=${VSS.getWebContext().user.id}`
    },
    allProjects: false,
    enabledProviders: {
      Commit: true,
      CreatePullRequest: true,
      ClosePullRequest: true,
      CloseWorkItem: true,
      CreateWorkItem: true,
      ResolveWorkItem: true,
      Changeset: false,
    },
    repository: defaultRepo && {key: defaultRepo.id, name: defaultRepo.name}
  } as IContributionFilter));
}

