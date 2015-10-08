from django.conf.urls import include, url

from dotandcross.views import *

urlpatterns = [
    url(r'^$', home_view, name='home'),
]
