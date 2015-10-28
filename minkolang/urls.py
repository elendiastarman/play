from django.conf.urls import include, url

from minkolang.views import *

urlpatterns = [
    url(r'^$', main_view, name='main'),
    url(r'^old$', old_main_view, name='main_old'),
##    url(r'^dotandcross/', dotandcross_view, name='dotandcross'),
]
