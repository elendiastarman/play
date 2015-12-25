from django.conf.urls import include, url

from d3applets.views import *

urlpatterns = [
    url(r'^$', home_view, name='home'),
    url(r'^dotandcross/', dotandcross_view, name='dotandcross'),
    url(r'^radians/', radiansDemo_view, name='radiansDemo'),
]
