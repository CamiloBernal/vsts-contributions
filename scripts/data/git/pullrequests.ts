import {
    ClosePullRequestContribution,
    CreatePullRequestContribution,
    IContributionProvider,
    ContributionName,
    UserContribution,
} from "../contracts";
import { repositories } from "./repositories";
import { GitPullRequestSearchCriteria, PullRequestStatus, GitPullRequest, GitRepository } from "TFS/VersionControl/Contracts";
import { getClient } from "TFS/VersionControl/GitRestClient";
import * as Q from "q";
import { CachedValue } from "../CachedValue";
import { IContributionFilter } from "../../filter";

export const createdPrs: {
    [username: string]: {
        [repoId: string]: CachedValue<GitPullRequest[]>
    }
} = {};

function getPullRequestsForRepository(username: string, repo: GitRepository, skip = 0): Q.IPromise<GitPullRequest[]> {
    const criteria = {
        creatorId: username,
        repositoryId: repo.id,
        status: PullRequestStatus.All,
    } as GitPullRequestSearchCriteria;
    return getClient().getPullRequests(repo.id, criteria, undefined, undefined, skip, 100).then(pullrequests => {
        for (const pr of pullrequests) {
            // backcompat with older tfs versions
            pr.repository = repo;
        }
        if (pullrequests.length < 100) {
            return pullrequests;
        }
        return getPullRequestsForRepository(username, repo, skip + 100).then(morePullreqeusts => [...pullrequests, ...morePullreqeusts]);
    });
}

export function getPullRequests(filter: IContributionFilter): Q.IPromise<GitPullRequest[]> {
    return repositories.getValue().then(repositories => {
        const projId = VSS.getWebContext().project.id;
        if (!filter.allProjects) {
            repositories = repositories.filter(r => r.project.id === projId);
        }
        const username = filter.identity.id;
        return Q.all(repositories.map(r => {
            const repoId = r.id;
            if (!(username in createdPrs)) {
                createdPrs[username] = {};
            }
            if (!(repoId in createdPrs[username])) {
                createdPrs[username][repoId] = new CachedValue(() => getPullRequestsForRepository(username, r));
            }
            return createdPrs[username][repoId].getValue();
        })).then(pullrequestsArr => {
            const pullrequests: GitPullRequest[] = [];
            for (const arr of pullrequestsArr) {
                pullrequests.push(...arr);
            }
            return pullrequests;
        });
    })
}

export class CreatePullRequestProvider implements IContributionProvider {
    public readonly name: ContributionName = "CreatePullRequest";
    public getContributions(filter: IContributionFilter): Q.IPromise<UserContribution[]> {
        return getPullRequests(filter).then(pullrequests =>
            pullrequests
                .filter(pr => pr.creationDate)
                .map(pr => new CreatePullRequestContribution(pr)));
    }
}
export class ClosePullRequestProvider implements IContributionProvider {
    public readonly name: ContributionName = "ClosePullRequest";
    public getContributions(filter: IContributionFilter): Q.IPromise<UserContribution[]> {
        return getPullRequests(filter).then(pullrequests =>
            pullrequests
                .filter(pr => pr.closedDate)
                .map(pr => new ClosePullRequestContribution(pr)));
    }
}
