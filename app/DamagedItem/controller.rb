require 'rho'
require 'rho/rhocontroller'
require 'rho/rhoerror'
require 'helpers/browser_helper'
require 'base64'

class DamagedItemController < Rho::RhoController
  include BrowserHelper
  
  
  def take_picture_with_default_camera
    # Capture an image from the default camera on the device, using the default image settings
    
    Camera.take_picture(url_for(:action => :picture_taken_callback),{:desired_width => 100,:desired_height => 100,:format=>"JPG"})
    #Camera.take_picture(url_for(:action => :picture_taken_callback),{:max_resolution =>get_modify_camera_resulution,:desired_width => 101,:desired_height => 102,:format=>"JPG"})
  end
  
  def picture_taken_callback
    if (@params["status"]=="ok")
      image = Rho::Application.expandDatabaseBlobFilePath(@params["image_uri"])
      #Rho::WebView.execute_js("change_image_source('"+image+"')")
      base64Image = get_base64_image(image)
      Rho::WebView.execute_js("saveDamagedItemPicture('" + base64Image + "')")
    else
      Rho::WebView.execute_js("alert('Error taking Picture')")
    end
  end
  
  #method to get base64 image string
   def get_base64_image(image)
     image_base64 = Base64.encode64(open(image) { |io| io.read })
     filter_image = image_base64.gsub(/\r/,"").gsub(/\n/,"")
   end

end