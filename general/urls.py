from django.conf.urls import url

from general.views import tametsi_home_view

urlpatterns = [
    url(r'^tametsi$', tametsi_home_view, name='home'),
]
