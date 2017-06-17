import { GitCommitRef, GitRepository, GitPullRequest } from "TFS/VersionControl/Contracts";
import { WorkItem } from "TFS/WorkItemTracking/Contracts";
import { TfvcChangesetRef } from "TFS/VersionControl/Contracts";
import { IContributionFilter, IEnabledProviders } from "../filter";

export type ContributionName = keyof IEnabledProviders;

export interface IContributionProvider {
    readonly name: ContributionName;
    getContributions(filter: IContributionFilter): Q.IPromise<UserContribution[]>;
}

export interface IUserContributions {
    [day: number]: UserContribution[];
}

export class UserContribution {
    readonly day: Date;
    constructor(readonly date: Date) {
        this.day = new Date(date);
        this.day.setHours(0, 0, 0, 0);
    }
}

export class CommitContribution extends UserContribution {
    constructor(readonly repo: GitRepository, readonly commit: GitCommitRef) {
        super(new Date(commit.author.date));
    }
}

export abstract class PullRequestContribution extends UserContribution {
    constructor(readonly pullrequest: GitPullRequest, date: Date) {
        super(date);
    }
}

export class CreatePullRequestContribution extends PullRequestContribution {
    constructor(pullrequest: GitPullRequest) {
        super(pullrequest, pullrequest.creationDate);
    }
}
export class ClosePullRequestContribution extends PullRequestContribution {
    constructor(pullrequest: GitPullRequest) {
        super(pullrequest, pullrequest.closedDate);
    }
}

export abstract class WorkItemContribution extends UserContribution {
    constructor(readonly wi: WorkItem, dateStr: string) {
        super(new Date(dateStr));
    }
}

export class CreateWorkItemContribution extends WorkItemContribution {
    constructor(wi: WorkItem) {
        super(wi, wi.fields["System.CreatedDate"]);
    }
}

export class ResolveWorkItemContribution extends WorkItemContribution {
    constructor(wi: WorkItem) {
        super(wi, wi.fields["Microsoft.VSTS.Common.ResolvedDate"]);
    }
}

export class CloseWorkItemContribution extends WorkItemContribution {
    constructor(wi: WorkItem) {
        super(wi, wi.fields["Microsoft.VSTS.Common.ClosedDate"]);
    }
}

export class ChangesetContribution extends UserContribution {
    constructor(readonly changeset: TfvcChangesetRef, readonly projectName: string) {
        super(changeset.createdDate);
    }
}
