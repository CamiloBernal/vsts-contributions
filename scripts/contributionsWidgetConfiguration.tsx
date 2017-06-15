///<reference types="vss-web-extension-sdk" />
import {
    IWidgetConfiguration,
    WidgetStatus,
    WidgetSettings,
    IWidgetConfigurationContext,
} from "TFS/Dashboards/WidgetContracts";
import * as Q from "q";
import { renderFilters } from "./controls/filters";
import { WidgetStatusHelper, WidgetEvent, WidgetConfigurationSave } from "TFS/Dashboards/WidgetHelpers";
import { defaultFilter } from "./defaultFilter";
import { IContributionFilter, filterToIProperties } from "./data/contracts";
import { trackEvent } from "./events";

class ContributionsConfiguration implements IWidgetConfiguration {
    private context: IWidgetConfigurationContext;
    private filter: IContributionFilter;
    private configUpdated(filter: IContributionFilter) {
        this.filter = filter;
        this.context.notify(WidgetEvent.ConfigurationChange, WidgetEvent.Args({
            data: JSON.stringify(filter)
        }));
    }
    public load(
        widgetSettings: WidgetSettings,
        widgetConfigurationContext: IWidgetConfigurationContext
    ): Q.IPromise<WidgetStatus> {
        this.context = widgetConfigurationContext;
        this.filter = widgetSettings.customSettings.data
            ? JSON.parse(widgetSettings.customSettings.data)
            : defaultFilter;

        renderFilters(this.configUpdated.bind(this), this.filter);
        return WidgetStatusHelper.Success();
    }
    public onSave() {
        trackEvent("configUpdated", filterToIProperties(this.filter));
        return WidgetConfigurationSave.Valid({data: JSON.stringify(this.filter)})
    }
}

VSS.register("ContributionsWidget-Configuration", new ContributionsConfiguration());
