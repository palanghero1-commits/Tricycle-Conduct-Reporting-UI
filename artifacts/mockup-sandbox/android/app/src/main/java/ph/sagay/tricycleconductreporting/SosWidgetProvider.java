package ph.sagay.tricycleconductreporting;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.widget.RemoteViews;

public class SosWidgetProvider extends AppWidgetProvider {
    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] widgetIds) {
        for (int widgetId : widgetIds) {
            Intent intent = new Intent(Intent.ACTION_VIEW)
                .setClass(context, MainActivity.class)
                .setData(android.net.Uri.parse("tricycleconductreporting://sos-send"));
            PendingIntent launch = PendingIntent.getActivity(
                context,
                widgetId,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.sos_widget);
            views.setOnClickPendingIntent(R.id.sos_widget_button, launch);
            manager.updateAppWidget(widgetId, views);
        }
    }
}
