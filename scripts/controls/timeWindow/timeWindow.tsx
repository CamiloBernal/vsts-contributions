import * as React from "react";
import * as ReactDOM from "react-dom";
import { getContributions } from "../../data/provider";
import { toDateString, toCountString } from "../messageFormatting";
import {
    IUserContributions,
    UserContribution,
    CommitContribution,
    CreatePullRequestContribution,
    ClosePullRequestContribution,
    CreateWorkItemContribution,
    ResolveWorkItemContribution,
    CloseWorkItemContribution,
    ChangesetContribution,
} from "../../data/contracts";
import { CollapsibleHeader } from "../CollapsibleHeader";
import { IContributionFilter } from "../../filter";
import { IconButton } from "OfficeFabric/components/Button";
import { FocusZone, FocusZoneDirection } from "OfficeFabric/components/FocusZone";
import { List } from "OfficeFabric/components/List";
import { updateSelectedDate } from "../filters";
import { Commit, PullRequest, WorkItemComponent, Changeset } from "./contributionComponent";



class Commits extends React.Component<{ allContributions: UserContribution[], showDay: boolean }, {}> {
    render() {
        return <Contributions
            noun={"Created # commit"}
            items={this.props.allContributions.filter(c => c instanceof CommitContribution)}
            onRenderItem={(commit: CommitContribution) => <Commit commit={commit} showDay={this.props.showDay} />}
        />;
    }
}

class CreatePullRequests extends React.Component<{ allContributions: UserContribution[], showDay: boolean }, {}> {
    render() {
        return <Contributions
            noun={"Created # pull request"}
            items={this.props.allContributions.filter(c => c instanceof CreatePullRequestContribution)}
            onRenderItem={(pr: CreatePullRequestContribution) => <PullRequest pullrequest={pr} showDay={this.props.showDay} />}
        />;
    }
}

class ClosePullRequests extends React.Component<{ allContributions: UserContribution[], showDay: boolean }, {}> {
    render() {
        return <Contributions
            noun={"Closed # pull request"}
            items={this.props.allContributions.filter(c => c instanceof ClosePullRequestContribution)}
            onRenderItem={(pr: ClosePullRequestContribution) => <PullRequest pullrequest={pr} showDay={this.props.showDay} />}
        />;
    }
}

class CreateWorkItems extends React.Component<{ allContributions: UserContribution[], showDay: boolean }, {}> {
    render() {
        return <Contributions
            noun={"Created # work item"}
            items={this.props.allContributions.filter(c => c instanceof CreateWorkItemContribution)}
            onRenderItem={(wi: CreateWorkItemContribution) => <WorkItemComponent workItem={wi} showDay={this.props.showDay} />}
        />;
    }
}

class ResolveWorkItems extends React.Component<{ allContributions: UserContribution[], showDay: boolean }, {}> {
    render() {
        return <Contributions
            noun={"Resolved # work item"}
            items={this.props.allContributions.filter(c => c instanceof ResolveWorkItemContribution)}
            onRenderItem={(wi: ResolveWorkItemContribution) => <WorkItemComponent workItem={wi} showDay={this.props.showDay} />}
        />;
    }
}

class CloseWorkItems extends React.Component<{ allContributions: UserContribution[], showDay: boolean }, {}> {
    render() {
        return <Contributions
            noun={"Closed # work item"}
            items={this.props.allContributions.filter(c => c instanceof CloseWorkItemContribution)}
            onRenderItem={(wi: CloseWorkItemContribution) => <WorkItemComponent workItem={wi} showDay={this.props.showDay} />}
        />;
    }
}

class Changesets extends React.Component<{ allContributions: UserContribution[], showDay: boolean }, {}> {
    render() {
        return <Contributions
            noun={"Created # changeset"}
            items={this.props.allContributions.filter(c => c instanceof ChangesetContribution)}
            onRenderItem={(c: ChangesetContribution) => <Changeset changeset={c} showDay={this.props.showDay} />}
        />;
    }
}

class Contributions<T> extends React.Component<{
    noun: string,
    items: T[],
    onRenderItem: (item: T, index: number) => React.ReactNode;
}, {
    showChildren: boolean,
}> {
    render() {
        let { noun } = this.props;
        const count = this.props.items.length;
        const label = count === 1 ? noun : noun + "s";
        const title = label.match(/#/) ? label.replace('#', "" + count) : count + " " + label;
        return <CollapsibleHeader title={title} name={label.replace("# ", "").toLocaleLowerCase()} className={count === 0 ? "hidden" : ""}>
            <FocusZone direction={FocusZoneDirection.vertical} >
                <List
                    items={this.props.items}
                    onRenderCell={this.props.onRenderItem}
                />
            </FocusZone>
        </CollapsibleHeader>;
    }
}

class TimeWindow extends React.Component<{ date?: Date, allContributions: IUserContributions }, {}> {
    render() {
        const { date } = this.props;
        const contributions = this.getContributions();
        const showDay = !date;
        return <div className="time-window">
            <div className="time-header">
                <h3>{`${toCountString(contributions.length, "contribution")} ${date ? ` on ${toDateString(date)}` : " for the year"}`}</h3>
                {
                    date ?
                        <IconButton
                            icon={"ChromeClose"}
                            title={"Clear date filter"}
                            onClick={() => updateSelectedDate()}
                        /> : null
                }
            </div>
            <div>
                <Commits allContributions={contributions} showDay={showDay} />
                <Changesets allContributions={contributions} showDay={showDay} />
                <CreatePullRequests allContributions={contributions} showDay={showDay} />
                <ClosePullRequests allContributions={contributions} showDay={showDay} />
                <CreateWorkItems allContributions={contributions} showDay={showDay} />
                <ResolveWorkItems allContributions={contributions} showDay={showDay} />
                <CloseWorkItems allContributions={contributions} showDay={showDay} />
            </div>
        </div>;
    }
    private getContributions() {
        const { date, allContributions } = this.props;
        if (date) {
            return allContributions[date.getTime()] || [];
        }
        const contributions: UserContribution[] = [];
        for (const day in allContributions) {
            contributions.push(...allContributions[day]);
        }
        contributions.sort((a, b) => a.date.getTime() - b.date.getTime());
        return contributions;
    }
}

let renderNum = 0;
export function renderTimeWindow(filter: IContributionFilter) {
    const graphParent = $(".time-window-container")[0];
    const currentRender = ++renderNum;
    getContributions(filter).then(contributions => {
        if (currentRender === renderNum) {
            const date = filter.selectedDate;
            if (date) {
                const end = new Date(date);
                end.setDate(end.getDate() + 1);
            }
            ReactDOM.render(<TimeWindow date={date} allContributions={contributions} />, graphParent);
        }
    });
}